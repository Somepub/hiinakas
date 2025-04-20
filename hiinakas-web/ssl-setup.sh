#!/bin/sh

certbot --nginx -d hiinakas.com --non-interactive --agree-tos --email mallor.kingsepp@gmail.com

nginx -g "daemon off;" 