const walletA = {
    address:'mzbqsMTerWAKgPiUYAHZCJGd2NLnACZd3L',
    privateKey:'cS54TEp72FoSECLYehfpYd9DNbV7m9hJoU5gVgZELTjsfuvFjGGL'
}

const walletB = {
    address:'n3DmDB75uTjFQCnrQZmxVPagD6X7fCGJKD' ,
    privateKey: 'cT1cDWMtqTofzYPnXVpcxqniYGVGhyqvJs5sEzMaqnpXD1kRYM2q'
}



function sendBTC(fromAddress,toAddress,privateKey,amount){
    //connect to node
    const network = 'BTCTEST'
    axios.get(`https://sochain.com/api/v2/get_tx_unspent/${network}/${fromAddress}`).then(firstResponse => {   
        const inputs = [] 
        const utxos = firstResponse.data.data.txs;
        const totalAmountAvailable = 0 
        const inputCount = 0 
        for (const element of utxos) {
            let utxo = {} // Generate utxo object to specify input for transaction
            utxo.satoshis = Math.floor(Number(element.value) * 100000000) // 100 million satoshi = 1 Bitcoin
            utxo.script = element.script_hex // Script contains basic instructions for the transaction
            utxo.address = firstResponse.data.data.address // Address of the sender wallet
            utxo.txid = element.txid // Transaction ID of the transaction behind the utxo
            utxo.outputIndex = element.output_no // To identify the utxo

            totalAmountAvailable += utxo.satoshis // increase the available funds by the amount within the utxo
            inputCount += 1

            inputs.push(utxo);
        }

        // 2. Generate transaction
        const transaction = new bitcore.Transaction()
        const satoshiToSend = amount * 100000000 // 100 million satoshi = 1 Bitcoin
        let outputCount = 2 // one for recipient, one for change

        // calculate fee
        const transactionSize = inputCount * 180 + outputCount * 34 + 10 - inputCount
        let fee = transactionSize * 33 // 33 satoshi per byte

        if (totalAmountAvailable - satoshiToSend - fee < 0) { // Check, if funds are sufficient to send transaction
            throw new Error("Insufficient funds")
        }

        // Specify transaction
        transaction.from(inputs)
        transaction.to(toAddress, satoshiToSend)
        transaction.change(fromAddress)
        transaction.fee(Math.round(fee))
        transaction.sign(privateKey)

        const serializedTransaction = transaction.serialize()

        // broadcast transaction
        axios({method: "POST", url: `https://sochain.com/api/v2/send_tx/${network}`, data: {tx_hex: serializedTransaction},})
        .then(result => {
            console.log(result.data.data) // log the result
        })

    })
}

