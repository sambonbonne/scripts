#!/usr/bin/env sh

_orig="${1:-${HOME}/downloads}"
_dest="${2:-${HOME}/music}"

ogg_ge_in() {
  find ./ -name '* - *.ogg' -printf "%f\n"
}

ogg_ge_convert() {
  sed -e 's/.ogg$//' -e 's/ - /_/' -e 's/ \(.\)/\u\1/g' -e 's/[().]//g' | awk '{ print $1".ogg" }'
}

ogg_ge_out() {
  ogg_ge_in | ogg_ge_convert
}

ogg_ge_copy() {
  local origin

  while read origin; do
    cp "${_orig}/${origin}" "${_dest}/$(echo "${origin}" | ogg_ge_convert)"
  done
}

ogg_ge_in | ogg_ge_copy
