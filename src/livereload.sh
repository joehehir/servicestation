#!/bin/sh
set -eu

. /usr/src/app/util.sh

readonly INOTIFYD_MAX_DEPTH=9
readonly INOTIFYD_EVENT_MASK=cwDMxymnd
readonly LIVERELOAD_FIFO=/tmp/livereload-fifo
readonly TIMEOUT_DURATION_MS=10000

export LIVERELOAD_FIFO

APP_PID=1

has_scripts() {
    [ -d /var/www ] \
    && [ -z "$(find /var/www -maxdepth 0 -empty 2> /dev/null)" ]
}

mstime() (
    read -r seconds _ < /proc/uptime
    as_int="${seconds%.*}${seconds#*.}"
    printf "%s" "$(( as_int * 10 ))"
)

is_timeout() {
    [ $(( $(mstime) - TIMEOUT_DURATION_MS )) -gt "${1}" ]
}

log() {
    printf "[%s] %b\n" "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)" "${1}"
}

shutdown() (
    shutdown_event_timestamp="$(mstime)"

    [ -d "/proc/${APP_PID}" ] && {
        kill -s SIGTERM "${APP_PID}"
        while [ -d "/proc/${APP_PID}" ] && ! is_timeout "${shutdown_event_timestamp}"
        do
            sleep 0.1
        done
    }
    exit
)

main() {
    trap shutdown INT TERM HUP

    restart_pending=1

    rm -f "${LIVERELOAD_FIFO}"
    mkfifo "${LIVERELOAD_FIFO}"

    if [ -p "${LIVERELOAD_FIFO}" ]
    then
        # ref: https://coral.googlesource.com/busybox/+/refs/heads/master/miscutils/inotifyd.c
        find /var/www -type d -mindepth 0 -maxdepth $INOTIFYD_MAX_DEPTH \
            -exec sh -c "inotifyd - \"\${0}:${INOTIFYD_EVENT_MASK}\" > ${LIVERELOAD_FIFO} &" {} \; \
            2> /dev/null

        node --use-strict /usr/src/app/index.js \
            "$(scopes_json /var/www index.js)" \
            "$(user_agent_string)" \
            "${@}" \
            &
        APP_PID=$!

        # event listener
        while read -r event < "${LIVERELOAD_FIFO}"
        do
            case "${event}" in
                [$INOTIFYD_EVENT_MASK][[:space:]]*) ;;
                restart_pending=1)
                    restart_pending=1
                    continue
                    ;;
                *) continue ;;
            esac

            if [ "${restart_pending}" = 1 ]
            then
                restart_pending=0
                restart_event_timestamp="$(mstime)"
                log "[LIVE_RELOAD]: start"

                pgrep -f "inotifyd[[:space:]]-[[:space:]]/var/www" \
                    | {
                        while read -r inotifyd_pid
                        do
                            kill "${inotifyd_pid}"
                        done
                    }

                [ -d "/proc/${APP_PID}" ] && {
                    kill -s SIGTERM "${APP_PID}"
                    while [ -d "/proc/${APP_PID}" ] && ! is_timeout "${restart_event_timestamp}"
                    do
                        sleep 0.1
                    done

                    is_timeout "${restart_event_timestamp}" && {
                        log "\e[1;31m[LIVE_RELOAD]: timeout\e[0m"
                        exit
                    }
                }

                if ! has_scripts
                then
                    log "[LIVE_RELOAD]: wait"
                    until has_scripts || is_timeout "${restart_event_timestamp}"
                    do
                        sleep 0.1
                    done

                    is_timeout "${restart_event_timestamp}" \
                        && log "\e[1;31m[LIVE_RELOAD]: timeout\e[0m"
                fi

                find /var/www -type d -mindepth 0 -maxdepth $INOTIFYD_MAX_DEPTH \
                    -exec sh -c "inotifyd - \"\${0}:${INOTIFYD_EVENT_MASK}\" > ${LIVERELOAD_FIFO} &" {} \; \
                    2> /dev/null

                node --use-strict /usr/src/app/index.js \
                    "$(scopes_json /var/www index.js)" \
                    "$(user_agent_string)" \
                    "${@}" \
                    &
                APP_PID=$!

                log "[LIVE_RELOAD]: done"
            fi
        done
    fi
}
main "${@}"
