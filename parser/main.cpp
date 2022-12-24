#include "simdjson-2.2.2/simdjson.h"
#include <algorithm>
#include <array>
#include <cstdio>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>

inline bool is_bad_char(char chr) {
  return chr == '\n' || chr == '\r' || chr == '|' || chr == '^';
}

constexpr size_t BUF_SIZE = 1048576;
char buffer[BUF_SIZE + simdjson::SIMDJSON_PADDING];
int main(int argc, char **argv) {

  if (argc != 2) {
    std::cerr << "usage: ./main <file>\n";
    exit(0);
  }
  std::string cmd("unzstd ");
  cmd += argv[1];
  cmd += "  --long=31 -c";

  std::string result;
  FILE *pipe = popen(cmd.c_str(), "r");
  if (!pipe) {
    throw std::runtime_error("popen() failed!");
  }
  simdjson::ondemand::parser parser;
  memset(buffer, 0, sizeof(buffer));
  int rows = 0;
  while (fgets(buffer, BUF_SIZE, pipe) != nullptr) {
    // This initializes buffers big enough to handle this JSON.
    auto len = strlen(buffer);
    rows += 1;
    if (len == 0) {
      continue;
    }

    auto doc =
        parser.iterate(buffer, len, BUF_SIZE + simdjson::SIMDJSON_PADDING);
    simdjson::ondemand::object obj(doc.get_object());

    auto srr = obj.find_field_unordered("subreddit");
    if (srr.error() == simdjson::NO_SUCH_FIELD) {
    } else {
      auto authorr = obj.find_field_unordered("author");
      if (authorr.error() == simdjson::NO_SUCH_FIELD) {
      } else {
        auto author = authorr.value().get_string().take_value();
        auto title = std::string(obj["title"].get_string().take_value());
        title.erase(std::remove_if(title.begin(), title.end(), is_bad_char),
                    title.end());

        auto id = obj["id"].get_string().take_value();
        auto url = std::string(obj["url"].get_string().take_value());
        url.erase(std::remove_if(url.begin(), url.end(), is_bad_char),
                  url.end());
        auto subreddit = std::string(srr.get_string().take_value());
        subreddit.erase(
            std::remove_if(subreddit.begin(), subreddit.end(), is_bad_char),
            subreddit.end());

        auto score_field = obj.find_field_unordered("score");
        if (!score_field.is_null()) {
          auto score = obj["score"].get_int64().value();
          long int downs = 0;
          auto r = obj.find_field("downs");
          if (r.error() != simdjson::NO_SUCH_FIELD) {
            downs = r.get_int64().value();
          }

          long int ups = 0;
          auto rup = obj.find_field("ups");
          if (rup.error() != simdjson::NO_SUCH_FIELD) {
            ups = r.get_int64().value();
          }
          auto num_comments = obj["num_comments"].get_int64().value();

          auto over_18_a = obj["over_18"].get_bool().value();
          const char *over_18 = over_18_a ? "true" : "false";
          auto utc = obj.find_field_unordered("created_utc");
          if (utc.type() != simdjson::haswell::ondemand::json_type::string) {
            auto created_utc_int = obj["created_utc"].get_int64().value();

            printf("%.*s|%.*s|%.*s|%.*s|%s|%ld|%ld|%ld|%ld|%ld|%s\n",
                   static_cast<int>(id.length()), id.data(),
                   static_cast<int>(author.length()), author.data(),
                   static_cast<int>(subreddit.length()), subreddit.data(),
                   static_cast<int>(url.length()), url.data(), title.c_str(),
                   score, created_utc_int, num_comments, ups, downs, over_18);
          } else {
            auto created_utc_str = obj["created_utc"].get_string().take_value();

            printf("%.*s|%.*s|%.*s|%.*s|%s|%ld|%.*s|%ld|%ld|%ld|%s\n",
                   static_cast<int>(id.length()), id.data(),
                   static_cast<int>(author.length()), author.data(),
                   static_cast<int>(subreddit.length()), subreddit.data(),
                   static_cast<int>(url.length()), url.data(), title.c_str(),
                   score, static_cast<int>(created_utc_str.length()),
                   created_utc_str.data(), num_comments, ups, downs, over_18);
          }
        }
      }
    }

    buffer[len] = 0;
    buffer[len + 1] = 0;
    buffer[len + 2] = 0;
  }
  return 0;
}
