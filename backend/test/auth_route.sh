#!/bin/bash

# Define the URL and Bearer token
URL="http://localhost:1234/me"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDY0MzQ3ODEsImV4cCI6MTc0NjQ0NTU4MX0.EH5PRZnFxfwy42sWzabUdvgMRyH6CjG4VefHF9GsCXE"

# Send POST request with Bearer token
curl -k -X GET "$URL" \
  -H "Authorization: Bearer $TOKEN"
