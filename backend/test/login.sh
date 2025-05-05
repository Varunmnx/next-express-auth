#!/bin/bash

# Define the URL and login credentials
URL="http://localhost:1234/login"
USERNAME="admin"
PASSWORD="password123"

# Send POST request
curl -k -X POST "$URL" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}"
