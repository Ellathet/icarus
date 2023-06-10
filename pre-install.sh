#!/bin/bash
if [ -e java/open-pdf-sign.jar ]
then
    echo open-pdf-sign - already exists
else
 curl --location --output java/open-pdf-sign.jar \
  https://github.com/open-pdf-sign/open-pdf-sign/releases/latest/download/open-pdf-sign.jar
fi