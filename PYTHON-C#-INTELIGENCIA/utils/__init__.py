from rainbow_logging_handler import RainbowLoggingHandler
import logging
import sys
import os

# setup `logging` module
logger = logging.getLogger()
logger.setLevel(logging.INFO)
formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)8s] --- %(message)s (%(filename)s:%(lineno)s)", "%Y-%m-%d %H:%M:%S")

# setup `RainbowLoggingHandler`
handler = RainbowLoggingHandler(
    sys.stderr, color_funcName=('black', 'yellow', True))
handler.setFormatter(formatter)
logger.addHandler(handler)


def real_path(folder):
    return os.path.realpath(folder)

PATH_FEATURE_MODEL = real_path("utils/total_word_feature_extractor.dat")