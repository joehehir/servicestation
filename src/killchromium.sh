#!/bin/sh
set -e
trap exit INT TERM HUP

case "${1}" in
    ""|*[!0-9]*) printf -- 1 ;;
    *)
        [ -d "/proc/${1}" ] && {
            kill -s SIGTERM "${1}"
            while [ -d "/proc/${1}" ]
            do
                sleep 0.1
            done
            printf -- 0
            exit
        }
        printf -- 1
        ;;
esac
