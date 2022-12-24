import argparse
import subprocess
import sys
import time
import os
from pathlib import Path
from typing import List


def sh(cmd, **kwargs):
    sprint(cmd)
    kwargs["shell"] = kwargs.get("shell", True)
    kwargs["encoding"] = kwargs.get("encoding", "utf-8")
    kwargs["check"] = kwargs.get("check", True)
    return subprocess.run(cmd, **kwargs)


def sprint(*args):
    print(*args, file=sys.stderr)


ROOT = Path(__file__).resolve().parent
MAIN = ROOT / "parser" / "build" / "main"


def determine_files(args) -> List[str]:
    if args.one:
        return args.one
    elif args.data:
        files = sorted(os.listdir(args.data))
        if args.start:
            start_i = [i for i, f in enumerate(files) if args.start in f]
            if len(start_i) == 0:
                sprint(f"Did not find pattern {args.start} in files {files}")
                exit(1)
            else:
                files = files[start_i[0] :]
        if args.end:
            emd_i = [i for i, f in enumerate(files) if args.end in f]
            if len(emd_i) == 0:
                sprint(f"Did not find pattern {args.end} in files {files}")
                exit(1)
            else:
                files = files[: emd_i[0]]

        return [f"/data/reddit/data/{f}" for f in files]
    else:
        sprint("One of --data, --one, --end, or --start is required")
        exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", help="folder containing .zst reddit dumps")
    parser.add_argument("--one", action="append", help="just send this file")
    parser.add_argument("--filter-file", help="skip entries with this content")
    parser.add_argument(
        "--skip-setup", action="store_true", help="skip db initialization"
    )
    parser.add_argument(
        "--start",
        help="requires --data, only send files after this pattern has been seen",
    )
    parser.add_argument(
        "--end",
        help="requires --data, only send files before this pattern has been seen",
    )
    parser.add_argument("-j", default=1, help="parallel jobs")
    args = parser.parse_args()
    j = int(args.j)

    files = determine_files(args)

    if not MAIN.exists():
        print("The parser has not been built, build it now? [Y/n]", end=" ")
        choice = input().lower()
        if choice in {"y", "yes"}:
            sh("r build-parser")
        else:
            print("Cannot proceed without parser")
            exit(1)

    if not args.skip_setup:
        # create database
        sh("bash initialize_db.sh", check=False)

    sprint(
        "Sending", ", ".join(files) if len(files) < 10 else str(len(files)) + " files"
    )

    # Construct the command line invocations to pass to GNU parallel
    commands = [
        f"python3 -c 'import sys; print(\"{f}\", file=sys.stderr)' && {MAIN} {f}"
        for f in files
    ]
    if args.filter_file:
        with open(args.filter_file) as f:
            filters = [l.strip() for l in f.readlines() if l.strip() != ""]

        grep_filter = "\|".join(filters)
        commands = [
            # f"{c} | " + "{ " + f"grep -v '{grep_filter}'" + " || true; } | bash upload.sh"
            f"{c} | " + "{ " + f"grep -vi '{grep_filter}'" + " || true; }"
            for c in commands
        ]

    commands = "\n".join(commands) + "\n"
    sprint(commands)
    before = int(time.perf_counter())
    sh(f"parallel -j {j} --line-buffer --halt-on-error now,fail=1", input=commands)
    after = int(time.perf_counter())
    sprint(f"Done in {after - before} s")
