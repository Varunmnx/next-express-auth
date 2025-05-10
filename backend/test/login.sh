#!/bin/bash

# Define the URL and login credentials
URL="http://localhost:1234/login"
USERNAME="admin"
PASSWORD="password123"

# Set the file name
FILE_NAME="auth_tokens.txt"

# Check if the file already exists
if [ -f "$FILE_NAME" ]; then
  echo "File $FILE_NAME already exists. Appending to it..."
else
  echo "File $FILE_NAME does not exist. Creating it..."
  touch "$FILE_NAME"
fi

# Send POST request and capture the response
RESPONSE=$(curl -k -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}" -w "%{http_code}")

# Append the response to the file
echo "$RESPONSE" >> "$FILE_NAME"