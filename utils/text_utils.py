#-*- coding:utf-8 -*-
import re
from unicodedata import normalize


class NormText(object):
    def __init__(self):
        self.p = re.compile(
            r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', re.MULTILINE | re.IGNORECASE)

    def extract_email(self, text):
        return re.findall(self.p, text)

    def remover_acentos(self, txt):
        return normalize('NFKD', txt).encode('ASCII', 'ignore').decode('ASCII')
