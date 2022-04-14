#! /usr/bin/env sh

title=$1
title_dir_name=$(echo $title | tr '[:upper:]' '[:lower:]' | tr '[:blank:]' '-')
content_dir=content/posts/$title_dir_name
post_file=$content_dir/index.md

mkdir -p content_dir
touch $post_file

now=$(date -I'minutes')
template=$(cat <<EOF
---
title: "🤓 $title"
tags: []
date: $now
draft: true
---

EOF
)

echo "$template" > $post_file
