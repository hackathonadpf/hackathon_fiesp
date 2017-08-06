# -*- coding: utf-8 -*-
import tornado.web
import json

from tornado.escape import json_encode, json_decode

from handlers import run_background
from handlers import ParserNLU
from handlers import NormText

nlu = ParserNLU()
norm_text = NormText()

class ParserHandle(tornado.web.RequestHandler):
    def post(self):
        data = json_decode(self.request.body)
        self.set_header('Content-Type', 'application/json')
        res = nlu.parser(data)
        res["id"] = data["id"]
        res["estado_atual"] = data["estado_atual"]
        self.write(json_encode(res))
        self.finish()


"""class ParserHandle(tornado.web.RequestHandler):
    @tornado.web.asynchronous
    def post(self):
        data = json_decode(self.request.body)
        run_background(self.stt, self.on_complete, (data,))

    def on_complete(self, res):
        self.set_header('Content-Type', 'application/json')
        self.write(json_encode(res))
        self.finish()

    def stt(self, data):
        return nlu.parser(data)
"""