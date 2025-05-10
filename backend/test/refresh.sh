#!/bin/bash

# Define the URL and Bearer token
URL="http://localhost:1234/refresh"
  TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDY1MjI3ODMsImV4cCI6MTc0NjUzMzU4M30.HIGQn--Towj7CsOnfaDIoP2xvkC2BBGnXHfQY4SW07I"
  REFRESHTOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NDY1MjI3ODMsImV4cCI6MTc0NjYwOTE4M30.JWnoyT77XQhSiMxUyvYdfOkZ2Q7tDBxtjgmQfJbblO4"}200

  # Send POST request with Bearer token
curl -k -X POST "$URL" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "'"$REFRESHTOKEN"'"}'