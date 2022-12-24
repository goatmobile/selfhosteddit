import { h, render, Component, createRef } from "preact";
import { useState } from "preact/hooks";

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function Post(props) {
  const [showPreview, setShowPreview] = useState(false);
  let authorUrl = null;
  if (props.author !== "[deleted]") {
    authorUrl = (
      <span>
        <a class="text-blue-500" href={`/?author=${props.author}`}>
          {props.author}
        </a>{" "}
        (
        <a
          class="text-blue-500"
          href={`https://old.reddit.com/u/${props.author}`}
        >
          r
        </a>
        )
      </span>
    );
  } else {
    authorUrl = <span>[deleted]</span>;
  }
  const commentUrl = `https://old.reddit.com/r/${props.subreddit}/comments/${props.id}`;
  const postDate = new Date(props.created_utc * 1000);
  let preview = null;
  if (showPreview) {
    const container = document.querySelector("#container");
    const rect = container.getBoundingClientRect();
    preview = (
      <span>
        <a href={props.url}>
          <object
            style={{
              maxWidth: Math.max(window.innerWidth * 0.8, rect.width),
              maxHeight: Math.max(window.innerHeight * 0.8, rect.height),
            }}
            data={props.url}
          >
            <embed src={props.url} />
            Error: Embedded data could not be displayed.
          </object>
        </a>
      </span>
    );
  }
  return (
    <div id="container" class="m-4">
      <span class="text-lg">
        <span>[{props.score}] </span>
        <a class="text-blue-500" href={props.url}>
          {htmlDecode(props.title)}
        </a>
      </span>
      <span>
        <span
          class="border-purple-500 border-2 rounded-lg ml-2 px-2 py-1 text-sm cursor-pointer"
          onClick={() => {
            setShowPreview(!showPreview);
          }}
        >
          {showPreview ? "Hide" : "Open"}
        </span>
      </span>
      <div>
        <span>
          {postDate.toLocaleDateString()} by {authorUrl} (
          <a class="text-blue-500" href={commentUrl}>
            {props.num_comments} comments
          </a>
          ) to {props.subreddit}
        </span>
        {preview}
      </div>
    </div>
  );
}

function QueryForm(props) {
  const params = new URLSearchParams(window.location.search);
  let defaultForm = "all";
  let defaultValueKey = "abc";
  if (params.get("subreddit")) {
    defaultForm = "subreddit";
    defaultValueKey = "subreddit";
  } else if (params.get("author")) {
    defaultForm = "author";
    defaultValueKey = "author";
  } else if (params.get("query")) {
    defaultForm = "raw query";
    defaultValueKey = "query";
  }
  const [formType, setFormType] = useState(defaultForm);
  const [value, setValue] = useState(params.get(defaultValueKey));
  const [dayFrom, setDayFrom] = useState(params.get("dayfrom"));
  const [dayTo, setDayTo] = useState(params.get("dayto"));
  const radioChange = (e) => {
    setValue(null);
    setFormType(e.target.value);
  };

  const submit = () => {
    const data = {};
    data.dayfrom = dayFrom;
    data.dayto = dayTo;
    if (formType === "all") {
      updateUrl(data);
      actions.all(dayFrom, dayTo);
      return;
    }
    if (!value || !value.trim()) {
      alert("Please enter a value");
    } else {
      data[formType] = value;
      updateUrl(data);
      actions[formType](value, dayFrom, dayTo);
    }
  };

  const enterSubmit = (e) => {
    if (e.keyCode === 13) {
      submit();
    }
  };

  const actions = {
    all: props.onAllSubmit,
    subreddit: props.onSubmitSubreddit,
    author: props.onSubmitAuthor,
    "raw query": props.onSubmitRaw,
  };

  let form = null;
  if (formType === "all") {
  } else if (formType === "subreddit") {
    form = (
      <div>
        <label for="subreddit">subreddit</label>
        <input
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyUp={enterSubmit}
          value={value}
          type="text"
          name="subreddit"
        />
      </div>
    );
  } else if (formType === "author") {
    form = (
      <div>
        {" "}
        <label for="author">author</label>
        <input
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyUp={enterSubmit}
          value={value}
          type="text"
          name="author"
        />
      </div>
    );
  } else {
    form = (
      <div>
        {" "}
        <label for="query">query</label>
        <input
          onChange={(e) => {
            setValue(e.target.value);
          }}
          onKeyUp={enterSubmit}
          value={value}
          type="text"
          name="query"
        />
      </div>
    );
  }

  return (
    <div class="myform">
      <div>
        <input
          onChange={radioChange}
          type="radio"
          id="all"
          name="form-type"
          checked={formType === "all"}
          value="all"
        />
        <label for="all">all</label>
        <input
          onChange={radioChange}
          type="radio"
          id="subreddit"
          name="form-type"
          checked={formType === "subreddit"}
          value="subreddit"
        />
        <label for="subreddit">subreddit</label>
        <input
          onChange={radioChange}
          type="radio"
          id="author"
          name="form-type"
          checked={formType === "author"}
          value="author"
        />
        <label for="author">author</label>
        <input
          onChange={radioChange}
          type="radio"
          id="raw query"
          name="form-type"
          checked={formType === "raw query"}
          value="raw query"
        />
        <label for="raw query">raw query</label>
      </div>
      {form}
      <div>
        <label for="from">from</label>
        <input
          onChange={(e) => {
            setDayFrom(e.target.value);
          }}
          value={dayFrom}
          type="date"
          onKeyUp={enterSubmit}
          name="from"
        />
        <label for="to">to</label>
        <input
          type="date"
          name="to"
          onKeyUp={enterSubmit}
          value={dayTo}
          onChange={(e) => {
            setDayTo(e.target.value);
          }}
        />
      </div>
      <button
        class="w-48"
        onClick={() => {
          submit();
        }}
      >
        Search
      </button>
    </div>
  );
}

async function paramsFetch(url, data) {
  const paramdata = {};
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      paramdata[key] = value;
    }
  }
  let params = new URLSearchParams(paramdata);
  return await fetch(`${url}?` + params.toString());
}

function updateUrl(data) {
  if (!data) {
    window.history.pushState("", "", "");
    return;
  }
  let url = new URL(window.location.href);
  const params = {};
  for (const [key, value] of url.searchParams.entries()) {
    // each 'entry' is a [key, value] tupple
    params[key] = value;
  }
  for (const [key, value] of Object.entries(data)) {
    if (value) {
      params[key] = value;
    }
  }

  let newParams = new URLSearchParams(params);

  let newsearch = newParams.toString();
  if (newsearch !== url.searchParams.toString()) {
    window.history.pushState("", "", "?" + newsearch);
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: null,
      status: "nothing",
      day_from: props.dayfrom,
      day_to: props.dayto,
      subreddit: props.subreddit,
      query: props.query,
      author: props.author,
      no_filter: !props.query && !props.subreddit,
    };
  }
  componentDidMount() {
    this.dispatch_fetch();
  }
  async dispatch_fetch() {
    if (this.state.no_filter) {
      return await this.fetch_default(this.state.day_from, this.state.day_to);
    } else if (this.state.query) {
      return await this.fetch_query(
        this.state.query,
        this.state.day_from,
        this.state.day_to
      );
    } else if (this.state.subreddit) {
      return await this.fetch_subreddit(
        this.state.subreddit,
        this.state.day_from,
        this.state.day_to
      );
    } else if (this.state.author) {
      return await this.fetch_author(
        this.state.author,
        this.state.day_from,
        this.state.day_to
      );
    } else {
      this.setState({
        no_filter: true,
      });
    }

    return await this.fetch_default();
  }

  async fetch_subreddit(subreddit, from, to) {
    const sr = subreddit;
    // const sr = this.state.subreddit || "montageparodies";
    let url = `/${sr}`;
    this.setState({ status: "pending" });
    const r = await paramsFetch(`/subreddit/${subreddit}`, {
      dayfrom: from,
      dayto: to,
    });
    const data = await r.json();
    this.setState({ data: data, status: "done" });
  }

  async fetch_author(author, from, to) {
    this.setState({ status: "pending" });
    const r = await paramsFetch("/query", {
      query: `lower(author)='${author.toLowerCase()}'`,
      dayfrom: from,
      dayto: to,
    });
    const data = await r.json();
    this.setState({ data: data, status: "done" });
  }
  async fetch_default(from, to) {
    this.setState({ status: "pending" });
    const r = await paramsFetch("/query", {
      query: "1=1",
      dayfrom: from,
      dayto: to,
    });
    const data = await r.json();
    this.setState({ data: data, status: "done" });
  }
  async fetch_query(query, from, to) {
    this.setState({ status: "pending" });
    const r = await paramsFetch("/query", {
      query: query,
      dayfrom: from,
      dayto: to,
    });
    if (r.status >= 200 && r.status < 400) {
      const data = await r.json();
      this.setState({ data: data, status: "done" });
    } else {
      this.setState({ status: "error", error_message: "Malformed query" });
      return;
    }
  }

  render() {
    const els = [];
    if (this.state.status === "pending") {
      els.push(<p>loading...</p>);
    } else if (this.state.status === "error") {
      els.push(<p>error: {this.state.error_message}</p>);
    } else if (this.state.data === undefined || this.state.data === null) {
    } else if (this.state.data.length === 0) {
      els.push(<p>no data found</p>);
    } else {
      for (const item of this.state.data) {
        els.push(<Post {...item} />);
      }
    }

    return (
      <div class="p-0 md:p-5 max-w-4xl">
        <QueryForm
          onAllSubmit={(from, to) => {
            this.fetch_default(from, to);
          }}
          onSubmitSubreddit={(subreddit, from, to) => {
            this.fetch_subreddit(subreddit, from, to);
          }}
          onSubmitAuthor={(author, from, to) => {
            this.fetch_author(author, from, to);
          }}
          onSubmitRaw={(query, from, to) => {
            this.fetch_query(query, from, to);
          }}
        />
        <div class="font-serif">{els}</div>
      </div>
    );
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let params = new URLSearchParams(window.location.search);
  render(
    <App
      subreddit={params.get("subreddit")}
      dayfrom={params.get("dayfrom")}
      dayto={params.get("dayto")}
      query={params.get("query")}
    />,
    document.body
  );
});
