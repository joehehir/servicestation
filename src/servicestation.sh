#!/bin/sh
set -e

. /usr/src/app/util.sh

readonly ARGV="${*}"

argv_find_by_prefix() (
    prefix="${1}"

    case "${prefix}" in
        --*)
            match="$(printf "%s" "${ARGV}" | sed -nr "s#^.*(${prefix}[^[:space:]]*).*\$#\1#p")"
            [ -n "${match}" ] && return 0
            ;;
    esac
    return 1
)

follow_chrome_log() (
    format_chrome_log() {
        log="${1}"

        case "${log}" in
            *:INFO:CONSOLE*) ;;
            *) return ;;
        esac

        # contains date interpolation
        sed_prefix_timestamp="s#\[([0-9]{2})([0-9]{2})/([0-9]{2})([0-9]{2})([0-9]{2})\.([0-9]{3}).*\][[:space:]]{1}\"#\[$(date -u +%Y)-\1-\2T\3:\4:\5.\6Z\] #"
        sed_suffix_source=""
        case "${log}" in
            *,[[:space:]]source:[[:space:]]http://*)
                sed_suffix_source="s#\",[[:space:]]{1}source:[[:space:]]{1}http:\/\/[^/]+(.+)[[:space:]]{1}\(([[:digit:]]+)\)# \(\1:\2\)#"
                ;;
        esac

        log="$(printf "%s" "${log}" | sed -r "${sed_prefix_timestamp}; ${sed_suffix_source}")"
        printf "%s" "${log}"
    }

    tail -F "${CHROME_LOG_FILE}" \
        | cat \
        | {
            while read -r input
            do
                output="$(format_chrome_log "${input}")"
                [ "${output}" ] \
                    && printf "%s\n" "${output}" > /proc/1/fd/1
            done
        }
)

main() {
    if
        argv_find_by_prefix "--enable-logging" \
        && argv_find_by_prefix "--v=0" \
        && [ -f "${CHROME_LOG_FILE}" ]
    then
        follow_chrome_log &
    fi

    if
        [ "${NODE_ENV}" = "development" ] \
        && is "${LIVE_RELOAD}"
    then
        exec livereload "${@}"
    fi

    exec node --use-strict /usr/src/app/index.js \
        "$(scopes_json /var/www index.js)" \
        "$(user_agent_string)" \
        "${@}"
}
main "${@}"
