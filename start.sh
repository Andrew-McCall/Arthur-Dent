#!/bin/bash

SESSION="discord"

tmux has-session -t $SESSION 2>/dev/null

if [ $? != 0 ]; then
  echo "Starting tmux session and running 'npm run start'..."
  tmux new-session -d -s $SESSION -n 'Arthur' 'npm run start'
fi

echo "Attaching"
tmux attach-session -t $SESSION
