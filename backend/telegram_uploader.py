"""
Telegram Bot API wrapper for file upload/download.
Uses requests — no Pyrogram needed for ≤ 50 MB files.
For > 50 MB, Pyrogram support can be added later.
"""

import requests

TELEGRAM_API = 'https://api.telegram.org'


class TelegramUploader:
    def __init__(self, bot_token: str):
        self.token = bot_token
        self.base = f'{TELEGRAM_API}/bot{bot_token}'

    def get_me(self) -> dict:
        resp = requests.get(f'{self.base}/getMe')
        data = resp.json()
        if not data.get('ok'):
            raise Exception(data.get('description', 'getMe failed'))
        return data['result']

    def send_file(self, chat_id: str, file_path: str, file_type: str = 'photo') -> dict:
        """Upload a file to Telegram channel via Bot API (≤ 50 MB)."""
        if file_type == 'video':
            url = f'{self.base}/sendVideo'
            key = 'video'
        elif file_type == 'document':
            url = f'{self.base}/sendDocument'
            key = 'document'
        else:
            url = f'{self.base}/sendPhoto'
            key = 'photo'

        with open(file_path, 'rb') as f:
            resp = requests.post(
                url,
                data={'chat_id': chat_id},
                files={key: f},
                timeout=300,
            )

        data = resp.json()
        if not data.get('ok'):
            raise Exception(data.get('description', 'Upload failed'))
        return data['result']

    def get_file_url(self, file_id: str) -> str:
        """Get download URL for a Telegram file."""
        resp = requests.get(f'{self.base}/getFile', params={'file_id': file_id})
        data = resp.json()
        if not data.get('ok'):
            raise Exception(data.get('description', 'getFile failed'))
        file_path = data['result']['file_path']
        return f'{TELEGRAM_API}/file/bot{self.token}/{file_path}'
