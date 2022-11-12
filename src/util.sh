#!/bin/sh

is() {
    case "${1}" in
        ""|0|[Ff][Aa][Ll][Ss][Ee]) return 1 ;;
    esac
}

# enumerate scripts
scopes_json() (
    mount_path="${1}"
    script_name="${2}"

    sort_range_separator="¬"

    # sorted for request path matching precedence
    sort_scopes="$(
        find "${mount_path}" -type f -name "${script_name}" \
            | sed "s/${script_name}$/${sort_range_separator}/g" \
            | sort -n \
            | sed -r "s#${mount_path}|${sort_range_separator}##g"
    )"

    as_csv="$(
        printf "%s" "${sort_scopes}" \
            | tr "\n" "," \
            | sed "s/,$//"
    )"

    sed_json_prefix="s/^/[\"/"
    sed_json_join="s/,/\",\"/g"
    sed_json_suffix="s/$/\"]/"

    as_json="$(printf "%s" "${as_csv}" | sed "${sed_json_prefix}; ${sed_json_join}; ${sed_json_suffix}")"
    printf "%s" "${as_json}"
)

user_agent_string() (
    arch="$(uname -m)"
    app_ver="$(sed -nr "s#[[:space:]]+\"version\":[[:space:]]\"([[:digit:]\.]{5,})[^[:digit:]\.].*#\1#p" /usr/src/app/package.json)"
    chrome_ver="$(apk -v info 2> /dev/null | sed -nr "s#^chromium-([[:digit:]\.]{7,})[^[:digit:]\.].*#\1#p")"
    printf "Mozilla/5.0 (X11; Linux %s) Chrome/%s ServiceStation/%s" "${arch}" "${chrome_ver}" "${app_ver}"
)
