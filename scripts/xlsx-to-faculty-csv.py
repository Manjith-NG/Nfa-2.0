"""Convert legacy logins_nfa.xlsx to faculty import CSV."""
from __future__ import annotations

import csv
import re
import sys
from pathlib import Path

import openpyxl

from import_mappings import (
    map_department,
    map_designation,
    map_position_from_designation,
    map_role,
    parse_name,
)

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_XLSX = Path(r"c:\Users\Manjith\Downloads\logins_nfa (5).xlsx")
OUT = ROOT / "data" / "faculty-upload-batch2.csv"

OFFICE_MAP = {
    "CSC": "CS",
    "MNG": "MGMT",
    "LSC": "LS",
    "BPT": "PHY",
    "FSC": "FS",
    "COM": "COMM",
    "ELE": "EM",
    "IFL": "ENGLISH",
    "BHM": "HM",
    "RO": "REG_OFF",
    "COE": "EXAM",
    "PC": "PHY",
    "lsc": "LS",
}


def office_to_department(office: str | None) -> str:
    if not office:
        return "ADMIN"
    key = office.strip()
    return OFFICE_MAP.get(key, OFFICE_MAP.get(key.upper(), key.upper()))


def main() -> int:
    xlsx_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_XLSX
    if not xlsx_path.exists():
        print(f"File not found: {xlsx_path}", file=sys.stderr)
        return 1

    wb = openpyxl.load_workbook(xlsx_path, read_only=True)
    rows = list(wb.active.iter_rows(values_only=True))
    header = rows[0]
    print(f"Reading {xlsx_path.name} ({len(rows) - 1} rows)")

    out_rows: list[dict[str, str]] = []
    for raw in rows[1:]:
        if not raw or not raw[0]:
            continue
        employee_id = str(raw[0]).strip()
        email = str(raw[1] or "").strip().lower()
        if not email or "@" not in email:
            continue

        first_name = str(raw[3] or "").strip()
        last_name = str(raw[4] or "").strip()
        office = raw[5]
        designation = str(raw[10] or raw[11] or "Faculty").strip()
        role_label = str(raw[11] or "Faculty").strip()
        phone = str(raw[17] or "").strip() if len(raw) > 17 and raw[17] else ""
        name_field = str(raw[9] or "").strip()

        if not first_name and name_field:
            parsed = parse_name(name_field)
            first_name = parsed["firstName"]
            last_name = parsed["lastName"]
        elif not first_name:
            parsed = parse_name(email.split("@")[0].replace(".", " "))
            first_name = parsed["firstName"]
            last_name = parsed["lastName"]

        if not last_name:
            last_name = first_name

        dept = map_department(office_to_department(str(office) if office else ""))
        role_code = map_role(role_label)
        designation_code = map_designation(designation)
        position_code = map_position_from_designation(designation) or "ASST_PROFESSOR"

        out_rows.append(
            {
                "employeeId": employee_id,
                "email": email,
                "firstName": first_name,
                "lastName": last_name,
                "phone": re.sub(r"\D", "", phone)[-10:] if phone else "",
                "departmentCode": dept,
                "designationCode": designation_code,
                "positionCode": position_code,
                "roleCode": role_code,
                "password": str(raw[2] or "password123").strip() or "password123",
            }
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "employeeId",
        "email",
        "firstName",
        "lastName",
        "phone",
        "departmentCode",
        "designationCode",
        "positionCode",
        "roleCode",
        "password",
    ]
    with OUT.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(out_rows)

    print(f"Wrote {len(out_rows)} rows to {OUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
