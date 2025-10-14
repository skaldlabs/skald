#!/usr/bin/env python3

import tomllib


def extract_dependencies():
    with open("pyproject.toml", "rb") as f:
        pyproject = tomllib.load(f)

    deps = pyproject["project"]["dependencies"]

    with open("requirements.txt", "w") as f:
        for dep in deps:
            f.write(f"{dep}\n")


if __name__ == "__main__":
    extract_dependencies()
