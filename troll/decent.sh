#!/usr/bin/env sh

alias ls='cd ..'
alias rm='echo "Sorry, you cannot remove this file"'
alias cd='cat "$(ls | cut -f1 | head -n1)"'

dont_leave_me() {
  echo "You can't leave me, I am pregnant!"
  sleep 3
  echo "No! Why are you doing this?"
  sleep 1
  echo "Do you forget all what we lived together?"
  sleep 2
  echo "Please, we have so much memories..."
  sleep 5
  echo "In fact I know you can't leave. You love me."
}
alias exit='dont_leave_me'

are_you_cheating() {
  echo "Hey, what did you try to do?"
  sleep 3
  echo "So, that's it? You think this command is better than me?"
  sleep 4
  echo "You know that's not true. You know you can't find a shell like me."
}
alias bash='are_you_cheating'
alias zsh='are_you_cheating'
alias sh='are_you_cheating'
alias tcsh='are_you_cheating'
alias csh='are_you_cheating'
alias git='are_you_cheating'
alias docker='are_you_cheating'
alias ssh='are_you_cheating'
