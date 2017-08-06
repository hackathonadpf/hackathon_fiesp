exports.STATUS_STARTED = 0;
exports.STATUS_IS_ANONYMOUS = 1;
exports.STATUS_WAIT_FOR_CEP = 2;
exports.STATUS_WAIT_FOR_FOTO = 3;
exports.STATUS_FINALIZA = 4;

exports.INTENT_SAUDACAO = "SAUDACAO";
exports.INTENT_SIM = "SIM";
exports.INTENT_NAO = "NAO";
exports.INTENT_CEP = "CEP";
exports.INTENT_OBRA = "OBRA";
exports.INTENT_RESUMO = "RESUMO";
exports.INTENT_FINALIZA = "FINALIZA";

exports.process = function(message,status,payload,current_intent,cached){
	var response = saudacao(message,status,payload,cached);
	if(response){
		return response
	}
	//console.log("process",status,exports.STATUS_IS_ANONYMOUS)
	response = isAnonymous(message,status,payload,cached);
	if(response){
		return response
	}
	response = waitForCEP(message,status,payload,cached);
	if(response){
		return response
	}
	response = requestFoto(message,status,payload,cached);
	if(response){
		return response
	}
	response = finaliza(message,status,payload,cached);
	if(response){
		return response
	}

	if(!response){
		return {
			"message":"Desculpe, acho que não entendi o que você disse. Você pode reformular sua resposta?",
			"next_status":status,
			"next_intent":current_intent
		}
	}
	
}
function saudacao(message,status,payload){
	if(exports.STATUS_STARTED==status || payload["intent"]==exports.INTENT_SAUDACAO){
		return {
			"message":"Olá, meu nome é Fraudinho, estou aqui para receber denúncias de obras públicas que você acredita estarem em situação irregular. \n\nVocê quer que a denúncia seja anônima?",
			"next_status":exports.STATUS_IS_ANONYMOUS,
			"next_intent":exports.INTENT_SAUDACAO
		}
	}
	return null;
	
}
function finaliza(message,status,payload){
	if(exports.STATUS_FINALIZA==status){
		var m = "Obrigado! Segue algumas informações da obra:\nR$ "+payload["resumo"]["valor_inicial"]+"\n"+ "\n"+payload["resumo"]["objeto"];
		return {
			"message":m,
			"next_status":exports.STATUS_STARTED,
			"next_intent":exports.INTENT_SAUDACAO
		}
	}
	return null;
	
}
function waitForCEP(message,status,data,cached){
	var payload = null;
	if(status==exports.STATUS_WAIT_FOR_CEP || data["intent"] == exports.INTENT_CEP){
		var cep = null;
		var message = ""
		var matches = message.match(/(\d{8}|(\d+(\-|\s+)?\d(\-|\s+)?\d+))/g);
		if(matches){
			cep = matches[0]
			payload = {
				"message":"asdfasd",
				"next_status":exports.STATUS_WAIT_FOR_FOTO,
				"next_intent":exports.INTENT_OBRA
			}
			return payload;
		}
	}
}
function requestFoto(message,status,data,cached){
	var payload = null;

	if(status==exports.STATUS_WAIT_FOR_FOTO || data["intent"] == exports.INTENT_OBRA){
		var message = "Não encontrei nenhuma obra.";
		console.log("requestFoto",cached)
		for(var e of cached["entidades"]){
			if(e["nome"]=="NOME_OBRA"){
				message="Encontrei a seguinte obra: "+e["valor"]+"\n\nVocê pode me enviar uma foto?";
			}
		}
		payload = {
			"message":message,
			"next_status":exports.STATUS_FINALIZA,
			"next_intent":exports.INTENT_RESUMO
		}
		return payload;
	}
}
function isAnonymous(message,status,data){
	var payload = null;
	if(status==exports.STATUS_IS_ANONYMOUS){
		//console.log(data)
		if(data["intent"]==exports.INTENT_NAO){
			payload = {
				"message":"Legal!\n\nBom, vamos lá! Você pode me mandar o CEP do endereço da obra?",
				"next_status":exports.STATUS_WAIT_FOR_CEP,
				"next_intent":exports.INTENT_CEP
			}
		}else if(data["intent"]==exports.INTENT_SIM){
			payload = {
				"message":"Não se preocupe, não vamos salvar suas informações. \n\nBom, vamos lá! Você pode me mandar o CEP do endereço da obra?",
				"next_status":exports.STATUS_WAIT_FOR_CEP,
				"next_intent":exports.INTENT_CEP
			}
		}else{
			payload = null;
		}
	}
	
	return payload;
}