document.addEventListener('DOMContentLoaded', function() {
    var miner = null;
    // var leaderDict = {};
    // var leaderChanges = {};

    function getURLParameter(name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
    }

    function httpGetAsync(theUrl, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        };
        xmlHttp.open("GET", theUrl, true); // true for asynchronous
        xmlHttp.send(null);
    }

    function httpPostAsync(theUrl, data, callback) {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
                callback(xmlHttp.responseText);
        };
        xmlHttp.open("POST", theUrl, true); // true for asynchronous
        xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xmlHttp.send(data);
    }

    function isBTCAddress (address) {
        if (!/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return false;
        const bufferLength = 25;
        let buffer = new Uint8Array(bufferLength);
        const digits58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        for (var i = 0; i < address.length; i++) {
            const num = digits58.indexOf(address[i]);
            // buffer = buffer * 58 + num
            let carry = 0;
            for (var j = bufferLength - 1; j >= 0; --j) {
                // num < 256, so we just add it to last
                const result = buffer[j] * 58 + carry + (j === bufferLength - 1 ? num : 0);
                buffer[j] = result % (1 << 8);
                carry = Math.floor(result / (1 << 8));
            }
        }
        // check whether sha256(sha256(buffer[:-4]))[:4] === buffer[-4:]
        const hashedWords1 = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(buffer.slice(0, 21)));
        const hashedWords = CryptoJS.SHA256(hashedWords1).words;
        // get buffer[-4:] with big-endian
        const lastWordAddress = new DataView(buffer.slice(-4).buffer).getInt32(0, false);
        const expectedLastWord = hashedWords[0];
        return lastWordAddress === expectedLastWord;
      }

    function validateBitcoinAddress() {
        var bitcoinAddress = document.getElementById('BitcoinAddress').value;

        if ( ! isBTCAddress(bitcoinAddress) ) {
            alert("Enter a valid bitcoin address before starting mining");
            return null;
        }
        var url = './user';
        httpPostAsync(url, "bitcoinAddress="+bitcoinAddress, function() {
            console.log('Sent POST request');
        });
        return bitcoinAddress;
    }

    function checkMiner() {
        if (!miner || !miner.isRunning() ) {
            document.getElementById('ToggleMining').value = 'Start mining';
        }
        setTimeout(checkMiner, 1000);
    }

    function updatePayouts() {
       /* function reqListener() {
            var payouts = null;
            try {
                payouts = JSON.parse(this.responseText);
            } catch(err) {
                document.getElementById('PayoutTable').innerHTML = 'No payouts so far';
            }

            var html = '<table><thead><th>Date</th><th>Bitcoin address</th><th>Payout (BTC)</th><th>Status</th></thead><tbody>';

            for (i=0; i<Math.min(payouts.length, 5); i++) {
                html = html + '<tr><td>' + payouts[i][0].split('.')[0] + '</td>';
                html = html + '<td>' + payouts[i][1] + '</td>';
                html = html + '<td>' + parseFloat(payouts[i][2]) + '</td>';
                html = html + '<td>' + payouts[i][3] + '</td></tr>';
            }
            html = html + '</tbody></table>';
            document.getElementById('PayoutTable').innerHTML = html;
        }

        function reqError(err) {
          console.log('Fetch Error :-S', err);
        }

        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.onerror = reqError;
        oReq.open('get', './payment.json', false);
        oReq.send();
		*/
    }
    updatePayouts();
   // setInterval(updatePayouts, 30000);

    function updateLeaderboard() {
        function reqListener() {
            var leaders = null;
            try {
                leaders = JSON.parse(this.responseText);
            } catch(err) {
                document.getElementById('LeaderboardTable').innerHTML = 'No updates since the last payout';
            }
            // var total_hashes = 0;
            // for (i=0; i<leaders.length; i++) {
            //     total_hashes = total_hashes + parseInt(leaders[i][1]);
            // }
            var html = '<table><thead><th>Bitcoin address</th><th>Mining done since last payout (hashes)</th><th>Probability of receiving next payout (%)</th><th>Hashes per second</th></thead><tbody>';
            var bold = '';
            var unbold = '';
            var bolda = '';
            var unbolda = '';
			leaders = leaders['users'];
            for (i=0; i<leaders.length; i++) {
                if ( leaders[i]['name'] == document.getElementById('BitcoinAddress').value ) {
                    bold = '<b>';
                    unbold = '</b>';
                } else {
                    bold = '';
                    unbold = '';
                }

                // if ( leaderDict[leaders[i][0]] && ( parseInt(leaders[i][1]) > parseInt(leaderDict[leaders[i][0]]) ) ) {
                //     leaderChanges[leaders[i][0]] = 15;
                // } else {
                //     leaderChanges[leaders[i][0]] = Math.max(leaderChanges[leaders[i][0]] - 1, 0);
                // }

//                if ( leaderChanges[leaders[i][0]]  > 0 ) {
                if ( leaders[i][4] > 0 ) {
                    bolda = '<b>';
                    unbolda = '</b>';
                } else {
                    bolda = '';
                    unbolda = '';
                }

                html = html + '<tr><td>' + bold + leaders[i]['name'] + unbold + '</td>';
                html = html + '<td>' + bolda + leaders[i]['balance'] + unbolda + '</td></tr>';
               // html = html + '<td>' + bold + leaders[i][3] + '%' + unbold + '</td>';
                //html = html + '<td>' + bold + leaders[i][6] + unbold + '</td></tr>';
                //html = html + '<td>' + bold + Math.round(parseInt(leaders[i][1])/total_hashes*1000)/10 + '%' + unbold + '</td></tr>';

                // leaderDict[leaders[i][0]] = leaders[i][1];
            }
            html = html + '</tbody></table>';
           // document.getElementById('LeaderboardTable').innerHTML = html;
        }

        function reqError(err) {
          console.log('Fetch Error :-S', err);
        }

        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.onerror = reqError;
        oReq.open('get', './js/statistics_users.json', false);
        oReq.send();
		
    }
    updateLeaderboard();
   // setInterval(updateLeaderboard, 10000);


    function updateStats() {
       /* if ( miner && miner.isRunning() ) {
            document.getElementById('UserHashesPerSecond').value = miner.getHashesPerSecond().toFixed(1);
        } else {
            document.getElementById('UserHashesPerSecond').value = "0.0";
        }
        var stats = null;
        function reqListener() {
            try {
                stats = JSON.parse(this.responseText);
            } catch(err) {
                console.log('Failed to get stats');
            }

            document.getElementById('HashesPerSecond').value = stats['site']['hashesPerSecond'].toFixed(1).toString();
            document.getElementById('NextPayout').value = stats['site']['nextPayoutTimeStr'];
        }

        function reqError(err) {
            console.log('Fetch Error :-S', err);
        }

        var oReq = new XMLHttpRequest();
        oReq.onload = reqListener;
        oReq.onerror = reqError;
        oReq.open('get', './coinhive_stats.json', false);
        oReq.send();
		*/
    }
    updateStats();
   // setInterval(updateStats, 5000);

    function updateCPUPower(valueStr) {
        value = parseFloat(valueStr);
        if ( value == 0 ) {
            if ( miner && miner.isRunning() ) {
                miner.stop();
            }
            document.getElementById('BitcoinAddress').readOnly = false;
            document.getElementById('ToggleMining').value = 'Start mining';
        }
        if ( miner && miner.isRunning() ) {
            miner.setThrottle(1-value/100);
        }
        document.getElementById('CPUPowerText').innerHTML = valueStr+'% of available CPU power will be used for mining';
    }
    document.getElementById('CPUPower').addEventListener('change', function() {
        updateCPUPower(document.getElementById('CPUPower').value);
    });

    document.getElementById('ToggleMining').addEventListener('click', function() {
		console.log(miner);
        if ( !miner || !miner.isRunning() ) {
            startMining();
        } else {
			
            miner.stop();
            document.getElementById('BitcoinAddress').readOnly = false;
            $('#ToggleMining').html('Start mining');
        }
    });

    function startMining() {
        var bitcoinAddress = addrCheck1();
        if ( bitcoinAddress ) {
            console.log(document.getElementById('CPUPower').value);
            if (document.getElementById('CPUPower').value == "0" ) {
                document.getElementById('CPUPower').value = "20";
            }
            document.getElementById('BitcoinAddress').readOnly = true;
            miner = new CoinHive.User('sWozkCgjeKTj565NCVz7FDXEA6K1NM06', bitcoinAddress);
			
            miner.start();
            updateCPUPower(document.getElementById('CPUPower').value);
		   $('#ToggleMining').html('Stop mining');
            
            setTimeout(checkMiner, 30000);
        }
        else{
            alert('Invalid address');
        }
    }

    var address = getURLParameter('address');
    if ( address ) {
        document.getElementById('BitcoinAddress').value = address;
        document.getElementById('CPUPower').value = 100;
        startMining();
    }

    function addrCheck1(){
    //clearAddr();
    var addr58 = $('#BitcoinAddress').val();
    try{
    if (addr58.length !== 95 && addr58.length !== 97 && addr58.length !== 51 && addr58.length !== 106){
        //validNo.innerHTML = "Invalid Address Length: " + addr58.length;
        throw "Invalid Address Length!";
    }
    var addrHex = cnBase58.decode(addr58);
    if (addrHex.length === 140){
        var netbyte = addrHex.slice(0,4);
    } else {
        var netbyte = addrHex.slice(0,2);
    }
    coins = {};
    coins['11'] = 'XMR Truncated';
    /*for (i = 0; i < coinTypeTag.getElementsByTagName('option').length; i++){
        coins[coinTypeTag.getElementsByTagName('option')[i].value] = coinTypeTag.getElementsByTagName('option')[i].innerHTML;
    }
    //viewkey + pID stuff
    /*if (netbyte === "13"){
        if (addrHex.length !== 154){
            validNo.innerHTML = "Invalid Address Length: " + addr58.length + " for " + coins[netbyte];
            throw "Invalid Address Length";
        }
        extraInput.value = addrHex.slice(130,-8);
    }*/
    if (netbyte === "11"){
        if (addrHex.length !== 74){
            clearAddr();
            validNo.innerHTML = "Invalid Address Length: " + addr58.length + " for " + coins[netbyte];
            throw "Invalid Address Length";
        }
        var privVk = sc_reduce32(cn_fast_hash(addrHex.slice(2,66)));
        extraInput.value = privVk;
        pubView2.value = sec_key_to_pub(privVk);
    }/* else if (addrHex.length === 140){
        pubView2.value = addrHex.slice(68,132);
    } else {
        pubView2.value = addrHex.slice(66,130);
    }
    if ((netbyte !== "11" && netbyte !== "13") && addrHex.length !== 138 && addrHex.length !== 140){
        clearAddr();
        validNo.innerHTML = "Invalid Address Length: " + addr58.length + " for " + coins[netbyte];
        throw "Invalid Address Length!";
    }*/
    var addrHash = cn_fast_hash(addrHex.slice(0,-8));
    //pubAddrHex.value = addrHex;
    if (addrHex.length === 140){
        //pubSpend2.value = addrHex.slice(4,68);
    } else {
       // pubSpend2.value = addrHex.slice(2,66);
    }
    /*pubAddrChksum.value = addrHex.slice(-8);
    pubAddrForHash.value = addrHex.slice(0,-8);
    pubAddrHash.value = addrHash;
    pubAddrChksum2.value = addrHash.slice(0,8);*/
    if (addrHex.slice(-8) == addrHash.slice(0,8)) {
       // validYes.innerHTML = "Yes! This is a valid " + coins[netbyte] + " address.";
        return true;
    } else {
        return false;
        
    }
    xmrAddr.value = toPublicAddr("12", pubSpend2.value, pubView2.value);
    }catch(ex){
        return false;
    }
    
}

}, false);
