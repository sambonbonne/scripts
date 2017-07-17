#!/usr/bin/env sh

MUSIC_FOLDER="${1:-${HOME}/music}"

list_music() {
  escaped="$(echo "${MUSIC_FOLDER}" | sed -e 's/[]\/$*.^|[]/\\&/g')"
  find "${MUSIC_FOLDER}" -type f | sed -e "s/^${escaped}\///"
}

metadata() {
  find "${MUSIC_FOLDER}" -type f \
    | xargs -n 1 ffprobe 2>&1 \
    | grep "$(echo ${1} | tr [a-z] [A-Z])" \
    | cut -d':' -f 2 \
    | sed -e 's/^[[:space:]]*//' \
    | sort | uniq -c
}

echo "    $(list_music | wc -l) *"

list_music | rev | cut -d'.' -f 1 | rev | sort | uniq -c

echo ""

command -v ffprobe >/dev/null || { echo "If you install ffmpeg ffprobe, you'll have more stats"; exit 0; }

metadata "artist"
