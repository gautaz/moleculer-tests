#!/usr/bin/env bash

SPATH="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cat > "${SPATH}/.env" <<- EOE
	UID="$(id -u)"
	GID="$(id -g)"
EOE

cat > "${SPATH}/.passwd" <<- EOP
	"${LOGNAME}:*:$(id -u):$(id -g):container user:${HOME}:/sbin/nologin"
EOP
