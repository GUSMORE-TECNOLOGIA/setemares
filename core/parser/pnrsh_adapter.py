from __future__ import annotations

import json
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional


class PnrshNotAvailable(Exception):
	pass


def _pnrsh_path() -> Path:
	bin_path = Path("bin/pnrsh.exe").resolve()
	if not bin_path.exists():
		raise PnrshNotAvailable("binário pnrsh.exe não encontrado em bin/.")
	return bin_path


def decode_segments(lines: List[str]) -> Optional[Dict[str, Any]]:
	"""Chama o binário pnrsh para decodificar linhas de voo.
	Retorna dict (JSON) ou None em caso de falha.
	Cai para o decoder interno se pnrsh não estiver disponível.
	"""
	# 1) Tenta via pnrsh.exe se disponível
	try:
		cmd = [str(_pnrsh_path())]
		payload = "\n".join(lines)
		proc = subprocess.run(cmd, input=payload.encode("utf-8"), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
		if proc.returncode == 0:
			try:
				data = json.loads(proc.stdout.decode("utf-8", errors="ignore") or "{}")
				if data:
					return data
			except Exception:
				# continua para fallback
				pass
	except Exception:
		# Se qualquer erro ocorrer (inclui ausência do binário), tenta fallback interno
		pass

	# 2) Fallback: decoder interno puro (sem GitHub)
	try:
		from core.parser.itinerary_decoder import decode_lines as internal_decode
		return internal_decode(lines)
	except Exception:
		return None
