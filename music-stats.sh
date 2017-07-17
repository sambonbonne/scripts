#!/usr/bin/env sh

MUSIC_FOLDER="${1:-${HOME}/music}"

list_music() {
  escaped="$(echo "${MUSIC_FOLDER}" | sed -e 's/[]\/$*.^|[]/\\&/g')"
  find "${MUSIC_FOLDER}" -type f | sed -e "s/^${escaped}\///"
}

echo "    $(list_music | wc -l) *"

list_music | rev | cut -d'.' -f 1 | rev | sort | uniq -c
