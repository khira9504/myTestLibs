# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
# 
from typing import Protocol

class BaseDataModel(Protocol):
  def to_dict(self) -> dict[str, str]:
    pass

  @classmethod
  def from_dict(cls, data: dict[str, str]) -> BaseDataModel:
    pass