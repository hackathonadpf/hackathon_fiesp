# -*- coding:utf-8 -*-
import tornado.ioloop
import tornado.web
import tornado.options
import tornado.httpserver

from tornado import autoreload

from handlers.parser import ParserHandle

from utils import logger

tornado.options.define(
    "port", default=8080, help=None, type=int
)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            ("/parser", ParserHandle)
        ]

        settings = {
            "debug": True,
            "autoreload": True
        }

        tornado.web.Application.__init__(
            self, handlers, **settings
        )


if __name__ == "__main__":
    try:
        tornado.options.parse_command_line()

        app = tornado.httpserver.HTTPServer(Application())
        app.listen(tornado.options.options.port)

        logger.info(
            "WebService Tornado executando na porta {}".format(
                tornado.options.options.port
            )
        )
        io_loop = tornado.ioloop.IOLoop.instance()
        io_loop.start()
    except KeyboardInterrupt:
        exit()
