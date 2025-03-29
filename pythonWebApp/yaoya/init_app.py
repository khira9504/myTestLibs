import streamlit as st

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