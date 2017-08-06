#-*- coding:utf-8 -*-

from tornado.ioloop import IOLoop
from multiprocessing.pool import ThreadPool

_workers = ThreadPool(500)

def run_background(func, callback, args=(), kwds={}):
    def _callback(result):
        IOLoop.instance().add_callback(lambda: callback(result))
    _workers.apply_async(func, args, kwds, _callback)
