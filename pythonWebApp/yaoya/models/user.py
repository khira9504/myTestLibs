# futureはpythonの標準モジュールで型指定を簡単に反映できるもの
# list,tuple,dictなどは__future__で代替できる
from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from yaoya.const import UserRole
from yaoya.models.base import BaseDataModel

# dataclassデコレーターを使用するとデータを格納するために使用するもの
@dataclass(frozen=True)
class User(BaseDataModel):
  # コンストラクター
  user_id: str
  name: str
  birthday: date
  email: str
  role: UserRole

  def to_dict(self) -> dict[str, str]:
    return dict(
      user_id = self.user_id,
      name = self.name,
      birthday = self.birthday.isoformat(),
      email = self.email,
      role = self.role.name,
    )
  
  # classmethod：　クラス変数のようにクラスから直接使用できるメソッドのこと
  @classmethod
  def from_dict(cls, data: dict[str, str]) -> User:
    birthday = datetime.fromisoformat(data["birthday"])
    return User(
      user_id = data["user_id"],
      name = data["name"],
      birthday = birthday.date(),
      email = data["email"],
      role = UserRole[data["role"]],
    )