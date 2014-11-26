#!/bin/bash
while true
do
  curl -X GET "http://localhost:3000/api/colors/yo?username=testing"
  echo ""
  sleep 30
done
