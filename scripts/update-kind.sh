#!/bin/bash

set -e

function version_gt() { test "$(echo "$@" | tr " " "\n" | sort -V | head -n 1)" != "$1"; }

latest_release=$(curl --silent "https://api.github.com/repos/kubernetes-sigs/kind/releases/latest")
current_tag=$(yq e '.inputs.version.default' action.yml)
latest_tag=$(echo "$latest_release" | jq -r .tag_name)

current_version="${current_tag:1}"
latest_version="${latest_tag:1}"

if version_gt "$latest_version" "$current_version"; then

    current_tag_escaped=${current_tag//./\\.}
    latest_tag_escaped=${latest_tag//./\\.}

# Changes the KinD version in action.yml, README.md and src/constants.ts
    for file in action.yml README.md src/constants.ts; do
        sed -i "s/$current_tag_escaped/$latest_tag_escaped/g" $file
    done;

    latest_body=$(echo "$latest_release" | jq -r .body)
    latest_html_url=$(echo "$latest_release" | jq -r .html_url)

# Prepare the list of the five latest commits between the actual version and the latest
    diff_commits=$(curl --silent "https://api.github.com/repos/kubernetes-sigs/kind/compare/$current_tag...$latest_tag" |
     jq -r '[.commits[] | {message: .commit.message, code: .sha[0:7], url: .html_url}][0:5]')
    
    commit_number=$(echo "$diff_commits" | jq '.| length')
    
    commits=''
    for ((i=0 ; i<commit_number ; ++i)); do
        message=$(echo "$diff_commits" | jq .[$i].message | jq -r 'if .| length > 100 then .[0:100]+"..." else . end')
        code=$(echo "$diff_commits" | jq -r .[$i].code)
        url=$(echo "$diff_commits" | jq -r .[$i].url)
        commits+="<li><a href=\"$url\" target=\"_blank\"><code>$code</code></a> $message</li>"
    done

# Define the content required to create the pull request
    body="Bumps [sigs.k8s.io/kind](https://github.com/kubernetes-sigs/kind) from $current_version to $latest_version.\n"
    body+="<details><summary>Release notes</summary>"
    body+="<p><em>Sourced from <a href=\"https://github.com/kubernetes-sigs/kind/releases\" target=\"_blank\">sigs.k8s.io/kind's releases</a>.</em></p>"
    body+="<blockquote cite=\"$latest_html_url\">$latest_body</blockquote></details>"
    body+="<details><summary>Commits</summary>"
    body+="<ul>$commits<li>See full diff in <a href=\"https://github.com/kubernetes-sigs/kind/compare/$current_tag...$latest_tag\" target=\"_blank\">compare view</a></li></ul></details>"
    body="${body//'%'/'%25'}"
    body="${body//$'\n'/'%0A'}"
    body="${body//$'\r'/'%0D'}"

    branch="update/sigs.k8s.io/kind-$latest_version"
    commit_message="chore(deps): bump sigs.k8s.io/kind from $current_version to $latest_version"
    title="chore(deps): bump sigs.k8s.io/kind from $current_version to $latest_version"

# Print the content so it can be used in the github workflow
    echo "::set-output name=body::$body"
    echo "::set-output name=branch::$branch"
    echo "::set-output name=changed::true"
    echo "::set-output name=commit-message::$commit_message"
    echo "::set-output name=title::$title"
else
# In case there is no new version
    echo "::set-output name=changed::false"
fi

