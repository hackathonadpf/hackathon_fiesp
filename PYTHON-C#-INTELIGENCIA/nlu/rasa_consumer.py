#-*- coding:utf-8 -*-
import codecs
import json

from rasa_nlu.config import RasaNLUConfig
from rasa_nlu.model import Metadata, Interpreter

import requests, datetime

from nlu import NormText, logger, PATH_FEATURE_MODEL, real_path

normt = NormText()

gg_maps_url = "https://maps.googleapis.com/maps/api/geocode/json?latlng={0},{1}&sensor=true"

class ParserNLU(object):
    def __init__(self):

        self.id_obra = "0"

        # CONFIGURA METAFILE
        logger.info("[*] CONFIGURANDO CONFIG FILE INTENCAO")
        _data_j = json.loads(
            codecs.open("models/intencao_config.json").read()
        )
        _data_j["path"] = real_path("models")
        _data_j["mitie_file"] = real_path(
            "utils/total_word_feature_extractor.dat")
        _data_j["data"] = real_path("models/intencao_data.json")
        with codecs.open("models/intencao_config.json", "w") as f:
            json.dump(
                _data_j, f, indent=4
            )

        # CONFIGURA METAFILE
        logger.info("[*] CONFIGURANDO METAFILE INTENCAO")
        _meta_j = json.loads(
            codecs.open("models/metadata.json").read()
        )
        _meta_j["mitie_file"] = real_path(
            "utils/total_word_feature_extractor.dat")
        with codecs.open("models/metadata.json", "w") as f:
            json.dump(
                _meta_j, f, indent=4
            )

        # CARREGA MODELO
        logger.info("[*] CARREGANDO MODELO -> INTENCOES")
        meta_data = Metadata.load(real_path("models"))
        self.inteligencia = Interpreter.load(
            meta_data, RasaNLUConfig(real_path("models/intencao_config.json")))

    def parser(self, data):
        """
            PARSER NA ENTRADA PARA GERAR O RETORNO PROCESSADO PELA I.A
        """
        logger.info("PROCESSANDO IA")
        ret = self.inteligencia.parse(data["msg"])

        # CASO O ESTADO ATUAL SEJA CEP
        if data["estado_atual"] == "CEP":
            logger.warning("[*] REQUISICAO API DADOS.GOV")
            r = requests.get(
                "http://compras.dados.gov.br/licitacoes/v1/uasgs.json?cep=%s" % data["msg"])
            _r_json = r.json()

            # ALTERANDO INTENCAO
            ret["intent"]["name"] = "OBRA"
            ret["intent"]["confidence"] = 1.0

            # ADICIONANDO ENTIDADES
            ret["entities"].append(
                {
                    "confidence": 0.99,
                    "valor": _r_json["_embedded"]["uasgs"][0]["nome"],
                    "nome": "NOME_OBRA"
                }
            )
            ret["entities"].append(
                {
                    "confidence": 0.99,
                    "valor": _r_json["_embedded"]["uasgs"][0]["id"],
                    "nome": "ID_OBRA"
                }
            )

        elif data["estado_atual"] == "LOGLAT":
            logger.warning("[*] CONVERTENDO LATITUDE/LONGETUDE PARA ENDERECO")
            longitude, latitude = data["msg"].split("|")
            _g_r = requests.get(gg_maps_url.format(longitude,latitude))
            _g_r_json = _g_r.json()
            t_postal = False
            for x in _g_r_json["results"]:
                for address_component in x["address_components"]:
                    if "postal_code" in address_component["types"]:
                        postal_code = address_component["long_name"]
                        if "-" in postal_code:
                            t_postal = True
                            break
                if t_postal:
                    break

            logger.warning("[*] REQUISICAO API DADOS.GOV")
            r = requests.get(
                "http://compras.dados.gov.br/licitacoes/v1/uasgs.json?cep=%s" % postal_code.replace("-", "")
            )
            _r_json = r.json()
            # ALTERANDO INTENCAO
            ret["intent"]["name"] = "OBRA"
            ret["intent"]["confidence"] = 1.0

            # ADICIONANDO ENTIDADES
            ret["entities"].append(
                {
                    "confidence": 0.99,
                    "valor": _r_json["_embedded"]["uasgs"][0]["nome"],
                    "nome": "NOME_OBRA"
                }
            )
        elif data["estado_atual"] == "RESUMO":
            logger.warning("[*] REQUISICAO API DADOS.GOV")            
            r = requests.get(
                "http://compras.dados.gov.br:8080/licitacoes/v1/licitacoes.json?uasg=%s&data_publicacao_min=2016-08-05T00:00:00" % data["id_obra"])
            _r_json = r.json()
            
            modalidade = _r_json["_embedded"]["licitacoes"][0]["modalidade"]
            n_aviso = _r_json["_embedded"]["licitacoes"][0]["numero_aviso"]

            logger.warning("[*] REQUISICAO API DADOS.GOV")            
            _r = requests.get(
                "http://compras.dados.gov.br:8080/contratos/v1/contratos.json?uasg_contrato={0}&modalidade={1}&numero_aviso={2}".format(
                    data["id_obra"], modalidade, n_aviso
                )
            )
            r_r_json = _r.json()

            #add entidades de resumo
            ret["resumo"] = {
                "valor_inicial":r_r_json["_embedded"]["contratos"][0]["valor_inicial"],
                "data_inicio_vigencia":r_r_json["_embedded"]["contratos"][0]["data_inicio_vigencia"],
                "numero_processo":r_r_json["_embedded"]["contratos"][0]["numero_processo"],
                "data_termino_vigencia":r_r_json["_embedded"]["contratos"][0]["data_termino_vigencia"],
                "objeto":r_r_json["_embedded"]["contratos"][0]["objeto"]
            }

            ret["intent"]["name"] = "FINALIZA"
            ret["intent"]["confidence"] = 1.0

        if ret["intent"]["name"] not in ["SIM", "NAO", "SAUDACAO", "BAIXO_CALAO", "OBRA"]:
            # ZERANDO INTENCAO
            ret["intent"] = {}

        ret.pop("intent_ranking")

        return ret
