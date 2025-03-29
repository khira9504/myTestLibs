from pathlib import Path
from tempfile import TemporaryDirectory

from yaoya.app import MultiPageApp
from yaoya.const import PageId
from yaoya.pages.base import BasePage
from yaoya.pages.member.cart import CartPage
from yaoya.pages.member.order_detail import OrderDetailPage
from yaoya.pages.member.order_list import OrderListPage
from yaoya.pages.public.item_detail import ItemDetailPage
from yaoya.pages.public.item_list import ItemListPage
from yaoya.pages.public.login import LoginPage
from yaoya.services.auth import MockAuthAPIClientService
from yaoya.services.cart import MockCartAPIClientService
from yaoya.services.item import MockItemAPIClientService
from yaoya.services.mock import MockDB, MockSessionDB
from yaoya.services.order import MockOrderAPIClientService
from yaoya.services.user import MockUserAPIClientService
from yaoya.sesseion import StreamlitSessionManager

def init_session() -> StreamlitSessionManager:
  mockdir = Path(TemporaryDirectory().name)
  mockdir.mkdir(exist_ok=True)
  mockdb = MockDB(mockdir.joinpath("mock.db"))
  session_db = MockSessionDB(mockdir.joinpath("session.json"))
  ssm = StreamlitSessionManager(

  )
  return ssm

def init_pages(ssm: StreamlitSessionManager) -> list[BasePage]:
  pages = [
    # ページクラスを追加
  ]
  return pages

def init_app(ssm: StreamlitSessionManager, pages: list[BasePage]) -> MultiPageApp:
  app = MultiPageApp(ssm, pages)
  return app