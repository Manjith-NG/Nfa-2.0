"""Shared mapping helpers for Python import scripts."""

from __future__ import annotations

import re


def map_department(code: str) -> str:
    aliases = {
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
        "SNHS": "LS",
        "SMC": "COMM",
        "SCI": "LS",
        "SET": "ENG",
        "BUS": "COMM",
        "PS": "PSY",
    }
    upper = code.strip().upper()
    return aliases.get(upper, upper)


def map_designation(label: str) -> str:
    mapping = {
        "professor": "FACULTY",
        "assistant professor": "FACULTY",
        "associate professor": "FACULTY",
        "teaching assistant": "FACULTY",
        "assistant": "FACULTY",
        "senior lecturer": "FACULTY",
        "lecturer": "FACULTY",
        "chancellor": "CHANCELLOR",
        "vice chancellor": "VICE_CHANCELLOR",
        "pro vice chancellor": "PRO_VC",
        "registrar": "REGISTRAR",
        "controller of examinations": "COE",
        "controller of examination": "COE",
        "dean": "DEAN",
        "librarian": "LIBRARIAN",
        "placement cell": "PMSEB",
        "hod": "HOD",
        "faculty": "FACULTY",
        "iqac": "IQAC",
        "pmseb": "PMSEB",
    }
    return mapping.get(label.strip().lower(), "FACULTY")


def map_position_from_designation(label: str) -> str | None:
    mapping = {
        "professor": "PROFESSOR",
        "assistant professor": "ASST_PROFESSOR",
        "associate professor": "ASSOC_PROFESSOR",
        "teaching assistant": "TEACHING_ASST",
        "assistant": "ASSISTANT",
        "senior lecturer": "SENIOR_LECTURER",
        "lecturer": "LECTURER",
        "chancellor": "CHANCELLOR",
        "vice chancellor": "VICE_CHANCELLOR",
        "pro vice chancellor": "PRO_VC",
        "registrar": "REGISTRAR",
        "controller of examinations": "COE",
        "controller of examination": "COE",
        "dean": "DEAN",
        "librarian": "LIBRARIAN",
        "placement cell": "PLACEMENT_CELL",
        "director physiocare": "DIRECTOR_PHYSIO",
    }
    return mapping.get(label.strip().lower())


def map_role(label: str) -> str:
    mapping = {
        "faculty": "FACULTY",
        "hod": "HOD",
        "registrar": "REGISTRAR",
        "controller of examination": "COE",
        "controller of examinations": "COE",
        "coe": "COE",
        "ofc": "OFC",
        "iqac": "IQAC",
        "pmseb": "PMSEB",
        "hr": "HR",
        "admin": "ADMIN",
        "dean": "FACULTY",
        "chancellor": "FACULTY",
        "vice chancellor": "FACULTY",
        "librarian": "FACULTY",
    }
    return mapping.get(label.strip().lower(), "FACULTY")


def parse_name(raw: str) -> dict[str, str]:
    cleaned = re.sub(r"\s+", " ", raw.strip())
    bits = cleaned.split(" ")
    if len(bits) >= 2:
        return {
            "firstName": bits[0].title(),
            "lastName": " ".join(bits[1:]).title(),
        }
    return {"firstName": cleaned.title() or "Faculty", "lastName": cleaned.title() or "User"}
