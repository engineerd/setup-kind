install/yq:
	sudo wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
	sudo chmod a+x /usr/local/bin/yq

update/kind:
	scripts/update-kind.sh
	
.PHONY: install/yq update/kind
