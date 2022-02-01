window.app = {}

let $Body = $('body');
let chainId;
let contractSymbol,contractDecimals,contractFirst,contractName;

/********************************************************
    READY
********************************************************/
$(document).ready(function() {
    let $Body = $('body');

    $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function (e) {
        let TabId = $(e.target).attr('href');

        if(TabId =='#wallet'){
            /* Wallet Transactions */
            console.log('-------', $.OXO.data.currentAccount)
            $.Explorer.request._getLatestTransaction( $.OXO.data.currentAccount );
        }
    })

    /*
        OXO.App
        $.OXO.data.LastBlockNumber
    */
    $.OXO = {
        /* ########################
            WEB3
        ######################## */
        Web3: null,
        /* ########################
            APP DATA
        ######################## */
        data:{
            /*--------------------------------------------------
                OXO: App Variables
            --------------------------------------------------*/
            IsTest          : (location.origin==='file://' ? true : false),
            web3            : null,
            currentAccount  : null, 
            IsMetaMask      : null,
            contractAddress : null,
            chainId         : null,
            erc20ABI        : {},
            stakeTokenABI   : {},
            stakeToken      : null,
            CurrentTokenData: {},
            BlockTicker     : null,
            LastBlockNumber : null,
            CurrentSymbol   : 'MONEY',
            TokenUSDPrice   : 0.025,
            NetworkInfo     : [],
            tokenDecimal    : 8,
            LastBlockNumber : null
        },
        /* ########################
            APP INITIALIZE
        ######################## */
        init: function(){
            Template7.registerHelper('ConvertWei', function (TextString){
                var Text    = eval(TextString);
                return $.OXO.tools.ConvertWei(TextString) +' '+ $.OXO.data.CurrentSymbol;
            });
            Template7.registerHelper('ConvertTime', function (TextString){
                return new Date( eval(TextString) ).toUTCString();
            });
            Template7.registerHelper('PayWay', function (From, To){
                let $From   = eval(From);
                let $To     = eval(To);
                if($.OXO.data.currentAccount==$From){
                    return '<span class="badge badge-danger">OUT</span>';
                }else{
                    return '<span class="badge badge-success">IN</span>';
                }
            });

            /*--------------------------------------------------
                OXO: Init App
            --------------------------------------------------*/
            $('[data-toggle="tooltip"]').tooltip();

            /* Copy Clipboard */
            let clipboard = new ClipboardJS('.copy');
                clipboard.on('success', function(e) {
                    $.OXO.tools.Toast().fire({ icon: 'success', title: 'Copied!' });
                    e.clearSelection();
                });

                clipboard.on('error', function(e) {
                    console.error('Action:', e.action);
                    console.error('Trigger:', e.trigger);
                });

            /* Load Pre-Defined Data */
            // if($.OXO.data.IsTest==false){
            //     $.getJSON("dist/data/network-list.json", function (result) {
            //         $.OXO.data.NetworkInfo = result;
            //     });
            //     $.getJSON("dist/data/ERC20.json", function (result) {
            //         $.OXO.data.erc20ABI = result.abi;
            //     });
            //     $.getJSON("dist/data/StakeToken.json", function (result) {
            //         $.OXO.data.stakeTokenABI = result.abi;
            //     });
            // };

            Promise.all([
                $.getJSON("dist/data/network-list.json"),
                $.getJSON("dist/data/ERC20.json"),
                $.getJSON("dist/data/StakeToken.json"),
            ]).then((results) => {
                $.OXO.data.NetworkInfo      = results[0];
                $.OXO.data.erc20ABI         = results[1].abi;
                $.OXO.data.stakeTokenABI    = results[2].abi;

                $.OXO.tools.IsMetaMask().then(function(result) {
                    console.log('IsMetaMask:', result);
                    $.OXO.tools.toggleConnection();
                });

                if( $('[data-blocknumber]') ){
                    $.OXO.data.BlockTicker = setInterval(function(){
                        $.OXO.tools.UpdateBlockNumber();
                    }, 10000);
                };

                $('[data-maskmoney]').maskMoney({ 
                    thousands   : '', 
                    decimal     : '.', 
                    allowZero   : true,
                    precision   : $.OXO.data.tokenDecimal
                });

                /* Pre-Defined Network List */
                $( Object.entries( $.OXO.data.NetworkInfo ) ).each(function(index, el) {
                    let $netData = el[1];

                    console.log('Network List:', $netData.chainName )
                    $('#NetworkList').append(`
                    <a class="list-group-item list-group-item-light d-flex justify-content-between align-items-center" data-cmd="ChangeNetwork" data-id="${parseInt($netData.chainId, 16)}" data-param='{"chainId":${parseInt($netData.chainId, 16)}}'>
                        ${$netData.chainName}
                        <span class="badge bg-purple text-white badge-pill">${$netData.symbol}</span>
                    </a>
                    `);
                });
            });
        },
        /* ########################
            OXO STAKE
        ######################## */
        stake: {
            ContractAddress: "0xa844347E8DdDeE34a5c014626644CBa30231b6e2",
            /*--------------------------------------------------
                OXO: Get Stake Token
            --------------------------------------------------*/
            _getStakeToken: function(){
                return new Promise(function (resolve, reject) {
                    if ($.OXO.data.stakeToken == null) {
                        try {
                            $.OXO.data.stakeToken = new $.OXO.Web3.eth.Contract(
                                $.OXO.data.stakeTokenABI,
                                $.OXO.stake.ContractAddress
                            );

                            resolve( $.OXO.data.stakeToken )
                        } catch (error) {
                            console.log("_getStakeToken=>error: " + error);
                            reject(error)
                        }
                    }
                });
            }
        },
        /* ########################
            HANDLERS
        ######################## */
        handlers:{

        },
        /* ########################
            REQUEST
        ######################## */
        request:{
            /*--------------------------------------------------
                OXO: Get Block Number
            --------------------------------------------------*/
            _send: async function($obj) {
                try {
                    $.OXO.tools.loader('show');
                    $.OXO.Web3.eth.sendTransaction($obj).then(function (result){
                        $.OXO.tools.loader('hide');
                        console.log('sendTransaction Result: ', result);

                        $.OXO.tools.success('Your transaction has been sent to the network. TX:'+ result.transactionHash +'');
                    }).catch((err) => {
                        console.log('sendTransaction Catch', err);
                        if(err.code === 4001){
                            $.OXO.tools.error('You have not confirmed the operation on MetaMask.');
                            return false
                        }
                    })
                } catch (error) {
                    console.log("Error: " + error);
                    $.OXO.tools.error('There was a problem with the network and your transaction could not be processed.');
                }
            },
            /*--------------------------------------------------
                OXO: Get Block Number
            --------------------------------------------------*/
            _getChainId: async function() {
                console.log("$.OXO.request._getChainId("+ $.OXO.data.chainId +")");
                // console.log("getChainId()");
                //chainId = await web3.eth.net.getId() // From web3 rpc
                $.OXO.data.chainId = await window.ethereum.networkVersion; // From Metamask

                if ( $.OXO.data.NetworkInfo[$.OXO.data.chainId] != undefined) {
                    $("#networkid").html( $.OXO.data.chainId + " (" + $.OXO.data.NetworkInfo[$.OXO.data.chainId].chainName + ")");
                } else {
                    $("#networkid").html($.OXO.data.chainId + " (Unknown Network)");
                }

                SetNetworkInfo('connect');
                
                return $.OXO.data.chainId;
            },
            /*--------------------------------------------------
                OXO: Get Block Number
            --------------------------------------------------*/
            _getBlockNumber: function(){
                console.log("$.OXO.request._getBlockNumber()");
                return new Promise(function (resolve, reject) {
                    $.OXO.data.LastBlockNumber = $.OXO.Web3.eth.getBlockNumber();
                    resolve( $.OXO.data.LastBlockNumber );
                });
            },
            /*--------------------------------------------------
                OXO: Get Token Info
            --------------------------------------------------*/
            _getTokenInfo: function(_contractAddress) {
                console.log("$.OXO.request._getTokenInfo("+ _contractAddress +")");
                
                return new Promise(function (resolve, reject) {
                    try {
                        $.OXO.Web3.eth.getCode(_contractAddress).then(function(result) {
                            if (result == "0x") {
                               reject('This is not a contract address...');
                            }else if(result != "0x"){
                                let contractFirst = new $.OXO.Web3.eth.Contract(
                                    $.OXO.data.erc20ABI,
                                    _contractAddress
                                );

                                Promise.all([
                                    getName(contractFirst), 
                                    getSymbol(contractFirst), 
                                    getDecimals(contractFirst)
                                ]).then((response) => {
                                    $.OXO.data.CurrentTokenData.tokenImage    = '';
                                    $.OXO.data.CurrentTokenData.tokenName     = response[0]
                                    $.OXO.data.CurrentTokenData.tokenSymbol   = response[1];
                                    $.OXO.data.CurrentTokenData.tokenDecimals = response[2];
                                    $.OXO.data.CurrentTokenData.tokenAddress  = _contractAddress; 
                                });

                                resolve( $.OXO.data.CurrentTokenData );
                            }
                        });
                    } catch (error) { $.OXO.tools.error(error); reject(error) }
                });
            },
            /*--------------------------------------------------
                OXO: Get Balance
            --------------------------------------------------*/
            _getBalance: function( _currentAccount=$.OXO.data.currentAccount ){
                console.log("$.OXO.request._getBalance("+ _currentAccount +")");
                
                return new Promise(function (resolve, reject) {
                    try {
                        $.OXO.Web3.eth.getBalance(_currentAccount)
                            .then(function(result) {
                                // console.log('.getBalance: ', result );
                                // if (NetworkInfo[$.OXO.data.chainId] != undefined){
                                //     symbol = NetworkInfo[chainId].symbol
                                // };
                                resolve(result)
                            });
                    }catch(error){reject(error)}
                });
            }
        },
        /* ########################
            TOOLS
        ######################## */
        tools:{
            /*--------------------------------------------------

            --------------------------------------------------*/
            _generateQR: function(_address){
                var qrcode = new QRious({
                    element         : document.getElementById("qrcode"),
                    background      : '#ffffff',
                    backgroundAlpha : 1,
                    foreground      : '#6f42c1',
                    foregroundAlpha : 1,
                    level           : 'H', // 'L' - 'M' - 'Q' - 'H' 
                    padding         : 5,
                    mime            :'image/png',
                    size            : 220,
                    value           : _address
                });

                $('#QRModal').modal('show');
                $('#QRModal strong[data-walletid]').html( _address )
                    .attr('data-clipboard-text', _address)
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            _formatToCurrency: function(amount, Fixed){
                return "$" + amount.toFixed(Fixed).replace(/\d(?=(\d{3})+\.)/g, "$&,");
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            _USDPrice: function(Wei){
                $('[data-usd-price]').html( $.OXO.tools._formatToCurrency($.OXO.data.TokenUSDPrice, 10) );

                return $.OXO.tools._formatToCurrency( $.OXO.tools.ConvertWei(Wei) * $.OXO.data.TokenUSDPrice, 2);
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            Toast:()=>{
                return Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    didOpen: (toast) => {
                        toast.addEventListener('mouseenter', Swal.stopTimer)
                        toast.addEventListener('mouseleave', Swal.resumeTimer)
                    }
                });
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            UpdateBlockNumber: function(){
                console.log("$.OXO.tools.UpdateBlockNumber();");
                
                $.OXO.request._getBlockNumber().then(function(response){
                    if($.OXO.data.LastBlockNumber==parseInt(response)){
                        // console.log('BlockNumber Not change!');
                        return false;
                    }
                    // $("#LatesBlockNumber").html( response );
                    $('[data-blocknumber]').each(function(index, el) {
                        let $BlockContainer = $(this);
                        
                        $({ Counter: parseInt( $BlockContainer.html() ) }).animate({
                            Counter: parseInt(response)
                        },{
                            duration    : ($.OXO.data.LastBlockNumber==null?1000:2500),
                            easing      : 'swing',
                            step        : function() {
                                $BlockContainer.text(Math.ceil(this.Counter));
                            }
                        }); 
                    });

                    $.OXO.data.LastBlockNumber = parseInt(response);
                });
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            loader   : function(Cmd='show'){ 
                if(Cmd=='hide'){
                    Swal.hideLoading();
                }else{
                    Swal.fire({
                        title: 'warning', 
                        text: 'Please wait...', icon: 'warning', allowOutsideClick:false, allowEscapeKey:false, showCancelButton:false, showDenyButton:false, showConfirmButton:false }); 
                    Swal.showLoading();
                }
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            error   : function(Msg){ Swal.fire({title: 'Error', text: Msg, icon: 'error'}); },
            /*--------------------------------------------------

            --------------------------------------------------*/
            info    : function(Msg){ Swal.fire({title: 'Info', text: Msg, icon: 'info'}); },
            /*--------------------------------------------------

            --------------------------------------------------*/
            warning : function(Msg){ Swal.fire({title: 'Warning', text: Msg, icon: 'warning'}); },
            /*--------------------------------------------------

            --------------------------------------------------*/
            success : function(Msg){ Swal.fire({title: 'Success', text: Msg, icon: 'success'}); },
            /*--------------------------------------------------

            --------------------------------------------------*/
            toggleConnection: function(){
                console.log("$.OXO.tools.toggleConnection()");
                console.log('ethereum.selectedAddress', ethereum.selectedAddress)
                console.log('$.OXO.data.currentAccount', $.OXO.data.currentAccount)
                
                if($.OXO.data.IsTest == true){
                    $Body.removeClass('not-connected').addClass('connected');
                    $('.ConnectStatus').html('Local Test').attr("disabled", true).removeClass('bg-success').addClass('bg-info');
                    return false;
                };

                if($.OXO.data.IsMetaMask == true){
                    $Body.removeClass('not-connected').addClass('connected');
                    $('.ConnectStatus').html('Connected').attr("disabled", false).removeClass('bg-danger').addClass('bg-success')

                    if($.OXO.Web3 == null){
                        $.OXO.connect();
                    };
                }else{
                    $('.ConnectStatus').html('Connect Wallet').attr("disabled", true).removeClass('bg-success').addClass('bg-danger');
                }

                if(ethereum.selectedAddress === null){
                    $Body.removeClass('connected').addClass('not-connected');
                    $('.ConnectStatus').html('Connect Wallet').attr("disabled", true).removeClass('bg-success').addClass('bg-danger');
                }

                if(($("#WalletConnectionModal").data('bs.modal') || {})._isShown){
                    $("#WalletConnectionModal").modal('hide');
                }
                return true;
            },
            /*--------------------------------------------------
                Add network to MetaMask
            --------------------------------------------------*/
            addToMetamask: async function(data) {
                console.log("$.OXO.tools.addToMetamask("+ data +")");

                try {
                    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
                    const wasAdded = await ethereum.request({
                        method: "wallet_watchAsset",
                        params: {
                            type: "ERC20", // Initially only supports ERC20, but eventually more!
                            options: {
                                address     : data.tokenAddress, // The address that the token is at.
                                symbol      : data.tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                                decimals    : data.tokenDecimals, // The number of decimals in the token
                                image       : data.tokenImage, // A string url of the token logo
                            },
                        },
                    });

                    if (wasAdded) {
                        $('[data-cmd="addToMetaMask"]').html('Token Added To MetaMask');
                        $.OXO.tools.success('Token added to MetaMask');
                    } else {
                        console.log("Your loss!");
                    }
                } catch (error) { $.OXO.tools.error(error); }
            },
            /*--------------------------------------------------
                Change Network
            --------------------------------------------------*/
            ChangeNetwork: async function (_chainId) {
                console.log("$.OXO.tools.ChangeNetwork(ChainId);");
                console.log("ChangeNetwork("+ arguments +")");

                if ( $.OXO.data.NetworkInfo[_chainId] != undefined) {
                    var HexChainId = $.OXO.Web3.utils.toHex(_chainId); //
                    try {
                        await ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: HexChainId }], // Hexadecimal version of ..., prefixed with 0x
                        });
                    } catch (error) {
                        if (error.code === 4001) {
                            $.OXO.tools.error('You canceled the switch network.');
                            return false
                        }
                        if (error.code === 4902) {
                            try {
                                await ethereum.request({
                                    method: "wallet_addEthereumChain",
                                    params: [{
                                        chainId: HexChainId, // Hexadecimal version of ... , prefixed with 0x
                                        chainName: $.OXO.data.NetworkInfo[_chainId].chainName,
                                        nativeCurrency: {
                                            name: $.OXO.data.NetworkInfo[_chainId].name,
                                            symbol: $.OXO.data.NetworkInfo[_chainId].symbol,
                                            decimals: $.OXO.data.NetworkInfo[_chainId].decimals,
                                        },
                                        rpcUrls: [ 
                                            $.OXO.data.NetworkInfo[_chainId].rpcUrls[0]
                                        ],
                                        blockExplorerUrls: [
                                            $.OXO.data.NetworkInfo[_chainId].blockExplorerUrls[0],
                                        ],
                                        iconUrls: [ 
                                            $.OXO.data.NetworkInfo[_chainId].iconUrls
                                        ],
                                    }, ],
                                });
                            } catch (addError) { $.OXO.tools.error('Did not add network'); }
                        }
                    }
                }else{
                    console.log('NetworkInfo[_chainId]=undefined');
                }
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            IsMetaMask: async function(){
                console.log("$.OXO.tools.IsMetaMask()");

                return new Promise(function (resolve, reject) {
                    if (typeof window.ethereum !== "undefined") {
                        console.log('detectMetaMask ethereum: ', ethereum);
                        
                        ethereum.on("connect", handleConnect);
                        ethereum.on("accountsChanged", handleAccountsChanged);
                        ethereum.on("chainChanged", handleChainChanged);
                        ethereum.on("disconnet", handleDisconnect);
                        ethereum.on("message", handleMessage);
                        
                        $.OXO.data.IsMetaMask = true;
                        $.OXO.data.chainId = parseInt(ethereum.chainId, 16);
                        resolve(true);
                    } else {
                        console.log("Metamask is not installed!");
                        
                        $.OXO.data.IsMetaMask = false;
                        resolve(false);
                    };
                });
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            ConvertWei: function(Val){
                return $.OXO.Web3.utils.fromWei(Val, "ether");
            }
            /*--------------------------------------------------
            
            --------------------------------------------------*/
        },
        /* ########################
            WALLET GENERATOR
        ######################## */
        GenerateWallet: function(){
            return new Promise(function (resolve, reject) {
                resolve( $.OXO.Web3.eth.accounts.create() );
            });
        },
        /* ########################
            CONNECT NETWORK
        ######################## */
        connect : function(){
            console.log("OXO.connect();");
            if($.OXO.data.IsTest){return false;}

            try {
                $.OXO.Web3 = new Web3(window.ethereum);
                // web3 = new Web3(new Web3.providers.HttpProvider("https://rpc.testnet.oxochain.com"));
                // $.OXO.request._getChainId();
                // $.OXO.request._getBlockNumber();
            } catch (error) {
                $.OXO.tools.error(error);
                return false
            }

            ethereum.request({ method: "net_version" }).then(function(result) {
                handleChainChanged;
            })
            .catch((err) => {
                console.error('net_version', err);
                return false
            });

            ethereum.request({ method: "eth_requestAccounts" }).then(handleAccountsChanged)
            .catch((err) => {
                if(err.code === -32002){
                    $.OXO.tools.warning('Open your MetaMask wallet and approve pending connection request.');
                    $.OXO.tools.toggleConnection();
                    return false;
                };

                if (err.code === 4001) {
                    // EIP-1193 userRejectedRequest error
                    // If this happens, the user rejected the connection request.
                    $.OXO.tools.error('You refused to connect Metamask');
                    console.log("Please connect to MetaMask.");
                    
                    $.OXO.tools.toggleConnection();
                    $('#WalletConnectionModal').modal('show');
                    // $("#status").html("You refused to connect Metamask");
                } else {                    
                    console.error('eth_requestAccounts', err);
                    return false
                }
            });

            // $.OXO.toggleConnection();
            // $.OXO.Tools.toggleConnection();
        }
    };

    /*
        Explorer API
        $.Explorer.request._getLatestTransaction(address);
    */
    $.Explorer = {
        data: {
            ApiPath: 'https://explorer.testnet.oxochain.com/'
        },

        request: {
            _getLatestTransaction: function(_address){
                if(typeof _address == undefined || typeof _address ==null){
                    return false
                };

                Promise.all([
                    $.getJSON($.Explorer.data.ApiPath + "api?module=account&action=txlist&address="+ _address)
                ]).then((results) => {
                    $('#LatestTransactions body tr').remove();

                    let HTMLTemplate = Template7.compile(`
                    {{#each result}}
                        <tr> 
                            <td>{{PayWay from to}}</td>
                            <td>
                                <div class="block_hash" data-link="tx">{{blockHash}}</div>
                                <div class="from_to">
                                    <span data-link="address">{{from}}</span>
                                    <i class="fas fa-long-arrow-alt-right"></i>
                                    <span data-link="address">{{to}}</span>
                                </di>
                            </td>
                            <td>{{ConvertTime timeStamp}}</td>
                            <td align="right">{{ConvertWei value}}</td>
                        </tr>
                    {{/each}}`);

                    $('#LatestTransactions tbody').append( HTMLTemplate( results[0] ) );
                });
            }
        }
    }


    /*
        OXO.App Init
    */
    $.OXO.init();
































    /*
        handle Disconnect
    */
    function handleDisconnect() {
        console.log("handleDisconnect()");
        window.location.reload();
    };

    /*
        
    */
    function handleConnect(_chainId) {
        console.log("handleConnect(" + _chainId + ")");
        // $.OXO.data.chainId = _chainId;

    };

    /*
        
    */
    function handleMessage(_chainId) {
        console.log("handleMessage('" + _chainId.type + "') ==> ", _chainId.data);

    };

    /*
        
    */
    function handleChainChanged(chain) {
        console.log("handleChainChanged(" + chain + ")");
        cId = parseInt(chain, 16);

        if ($.OXO.data.chainId !== cId){
            window.location.reload()
            return false;
        };

        $.OXO.data.chainId = cId;
        
        SetNetworkInfo('handleChainChanged');
    };
    function SetNetworkInfo(fName){
        console.log('SetNetworkInfo()=> chainId: ', fName, parseInt(fName,16), $.OXO.data.chainId);

        if ( $.OXO.data.NetworkInfo[$.OXO.data.chainId] !== undefined) {
            let $ChainData = $.OXO.data.NetworkInfo[$.OXO.data.chainId];

            $('#ChainName').html( $ChainData.chainName );
            $('#ChainId').html( parseInt($ChainData.chainId, 16) + ' ('+ $ChainData.chainId +')');
            $('#TokenName').html( $ChainData.name );
            $('#TokenSymbol').html( $ChainData.symbol );
            $('#TokenDecimal').html( $ChainData.decimals );

            var RpcUrls = Object.keys( $.OXO.data.NetworkInfo[$.OXO.data.chainId].rpcUrls ).map(function(k) { 
                return '<a href="'+ $.OXO.data.NetworkInfo[$.OXO.data.chainId].rpcUrls[k] +'" target="_blank" class="btn-link">'+ $.OXO.data.NetworkInfo[$.OXO.data.chainId].rpcUrls[k]  +'</a>'
            }).join("<br>");
            $('#RpcUrl').html( RpcUrls );

            var ExplorerURLs = Object.keys( $.OXO.data.NetworkInfo[$.OXO.data.chainId].blockExplorerUrls).map(function(k) { 
                return '<a href="'+ $.OXO.data.NetworkInfo[$.OXO.data.chainId].blockExplorerUrls[k] +'" target="_blank" class="btn-link">'+ $.OXO.data.NetworkInfo[$.OXO.data.chainId].blockExplorerUrls[k]  +'</a>'
            }).join("<br>");
            $('#Explorer').html(ExplorerURLs);

            $('a[data-cmd="ChangeNetwork"]').removeClass('active');
            $('a[data-cmd="ChangeNetwork"][data-id="'+ $.OXO.data.chainId +'"]').addClass('active');
        }
    }

    /*
        Account Changed Handler
    */
    function handleAccountsChanged(accounts) {
        console.log("handleAccountsChanged(" + accounts + ")");
        if( $.OXO.data.NetworkInfo[$.OXO.data.chainId] != undefined){
            $.OXO.data.CurrentSymbol = $.OXO.data.NetworkInfo[$.OXO.data.chainId].symbol;
            $.OXO.data.tokenDecimal  = $.OXO.data.NetworkInfo[$.OXO.data.chainId].decimals;
        }

        $('[data-token-symbol]').html( $.OXO.data.CurrentSymbol );
        
        if (accounts.length === 0) {
            console.log('handleAccountsChanged 0: ', 'Connect with Metamask');
            $.OXO.tools.error('Please connect to MetaMask');
            $.OXO.tools.toggleConnection();
            // $("#enableMetamask").html("Connect with Metamask");
            // $("#balance").html("...");
            // $("#networkid").html("...");
        } else if (accounts[0] !== $.OXO.data.currentAccount) {
            $.OXO.data.currentAccount = accounts[0];
            console.log('handleAccountsChanged 1: ', $.OXO.data.currentAccount);
            // $("#enableMetamask").html(currentAccount);
            // $("#status").html("");
            if ($.OXO.data.currentAccount != null) {
                console.log('handleAccountsChanged 2: ', $.OXO.data.currentAccount);
                // $("#enableMetamask").html(currentAccount);
                
                $.OXO.request._getBalance().then(function(response) {
                    $('[data-walletid]').html( $.OXO.data.currentAccount )
                        .attr('data-clipboard-text', $.OXO.data.currentAccount);
                    
                    $('[data-wallet-balance]').html( $.OXO.tools.ConvertWei(response) +' '+ $.OXO.data.CurrentSymbol );
                    $('[data-wallet-usd-balance]').html( $.OXO.tools._USDPrice(response) );
                }).catch(function(err){
                    $.OXO.tools.error(err);
                });
                
                $.OXO.request._getChainId();
                $.OXO.tools.UpdateBlockNumber();
            }
        };

        console.log("WalletAddress in HandleAccountChanged [" + $.OXO.data.currentAccount + "]");
        $.OXO.tools.toggleConnection();
        if(($("#WalletConnectionModal").data('bs.modal') || {})._isShown){
            $("#WalletConnectionModal").modal('hide');
        };
    };


    /*
        
    */
    // async function getChainId() {
    //     console.log("getChainId()");
    //     //chainId = await web3.eth.net.getId() // From web3 rpc
    //     $.OXO.data.chainId = await window.ethereum.networkVersion; // From Metamask
    //     console.log("Network ID: " + $.OXO.data.chainId);

    //     if (NetworkInfo[$.OXO.data.chainId] != undefined) {
    //         $("#networkid").html(
    //             $.OXO.data.chainId + " (" + NetworkInfo[$.OXO.data.chainId].chainName + ")"
    //         );
    //     } else {
    //         $("#networkid").html($.OXO.data.chainId + " (Unknown Network)");
    //     }

    //     SetNetworkInfo('connect');
        
    //     return $.OXO.data.chainId;
    // };

    /*
        
    */
    function getSymbol(tokenData) {
        console.log("getSymbol();");
        return new Promise(function (resolve, reject) {
            try {
                tokenData.methods.symbol().call()
                    .then(function(result) {
                        contractSymbol = result;
                        resolve(contractSymbol);
                    });
            } catch (error) {
                console.log("Error: " + error);
                reject(error);
            }
        });
    };

    /*
        
    */
    function getDecimals(tokenData) {
        console.log("getDecimals();");
        return new Promise(function (resolve, reject) {
            try {
                tokenData.methods.decimals().call()
                    .then(function(result) {
                        contractDecimals = result;
                        resolve(contractDecimals);
                    });
            } catch (error) {
                console.log("Error: " + error);
                reject(error);
            }
        });
    };

    /*
        
    */
    function getName(tokenData) {
        console.log("getName();");
        return new Promise(function (resolve, reject) {
            try {
                tokenData.methods
                    .name()
                    .call()
                    .then(function(result) {
                        $("#btnToken").html('Add  "' + result + '" to Metamask');
                        contractName = result;
                        resolve(contractName);
                    });
            } catch (error) {
                console.log("Error: " + error);
                reject(error);
            }
        });
    };


    /*
        Command Palette
    */
    $Body.on('click', '[data-cmd]', function(event) {
        event.preventDefault();
        console.log('click=>[data-cmd]');

        /*
            Check MetaMask
        */
        if($.OXO.data.IsTest==false){
            if(typeof window.ethereum == "undefined"){
                $.OXO.tools.success('MetaMask support was not found in your browser');
                return false;
            };
        };

        let $Command    = $(this).data('cmd');
        let $Data       = $(this).data('param') ? JSON.parse($(this).attr('data-param')) : {};

        console.log('Komut: ', $Command)
        console.log('Param: ', $Data)

        switch($Command) {
            case 'Send':
                Swal.fire({
                    title               : 'Are you sure?',
                    text                : "You won't be able to revert this!",
                    icon                : 'warning',
                    showCancelButton    : true,
                    confirmButtonColor  : '#3085d6',
                    cancelButtonColor   : '#d33',
                    confirmButtonText   : 'Yes'
                }).then((result) => {
                    if (result.isConfirmed) {
                        $.OXO.request._send({
                            from    : $.OXO.Web3.eth.givenProvider.selectedAddress,
                            to      : $('#sendToAddress').val().trim(), 
                            value   : $.OXO.Web3.utils.toWei( $('#sendToVal').val().trim(), 'ether')
                        }).then(function(result) {

                        }).catch((err) => {
                            console.error('Send: ', err);
                        });
                    }
                });
                
                break;
            case 'Receive': 
                $.OXO.tools._generateQR( $.OXO.data.currentAccount );
                
                break;
            case 'generateWallet':
                $.OXO.GenerateWallet().then(function(result) {
                    $('#NewWalletAddress').val( result.address );
                    $('#NewWalletPKey').val( result.privateKey );

                    $.OXO.tools.Toast().fire({ icon: 'success', title: 'Wallet Created!' });
                }).catch((err) => {
                    console.error(err);
                });

                break;
            case 'ConnectMetaMask':
                $.OXO.connect();
                break;
            case 'getTokenInfo':
                $('#contractaddress').addClass('loading'); $('#TokenResults i').html('...');
                
                $('[data-cmd="addToMetaMask"]')
                    .attr({
                        'disabled'      : true,
                        'data-param'    : '{}'
                    }).html('Add Token to Metamask')
                    .removeClass('btn-success').addClass('btn-warning')

                $.OXO.request._getTokenInfo( $("#contractaddress").val().trim() )
                    .then(function(response){
                        console.log('_getTokenInfo response: ');
                        console.log(response);

                        $('#contractaddress').removeClass('loading');

                        $('#TI_Name').html( response.tokenName );
                        $('#TI_Symbol').html( response.tokenSymbol );
                        $('#TI_Decimals').html( response.tokenDecimals );
                        $('#TI_Address').html( response.tokenAddress );

                        $('[data-cmd="addToMetaMask"]')
                            .removeClass('btn-warning')
                            .addClass('btn-success')
                            .attr({
                                'disabled'  : false,
                                'data-param': JSON.stringify( response )
                            });
                    }).catch(function(err){
                        $('#contractaddress').removeClass('loading');
                        $("#contractaddress").val("0x");
                    });

                break;
            case 'addToMetaMask':
                $.OXO.tools.addToMetamask( $Data );
                break;
            case 'ChangeNetwork':
                let $NetworkPort 
                $.OXO.tools.ChangeNetwork( $Data.chainId );
                break;
            case 'CopyTokenToInfoInput':
                $('#contractaddress').val( $Data.value );
                break;
            default:
        }
        event.preventDefault();
        /* Act on the event */
    });

    /*
        -
    */
    $Body.on('click', '[data-link]', function(event) {
        event.preventDefault();
        let $ExpURL = $.OXO.data.NetworkInfo[$.OXO.data.chainId].blockExplorerUrls[0];
        let $Params = $(this).data('link');
        let $Data   = $(this).text().trim();

        switch($Params) {
            case 'tx':
                window.open($ExpURL+'/tx/'+$Data);
                // https://explorer.testnet.oxochain.com/tx/0xbfba8c34e551d08671d269e917cc13bd94a9d696c1dbcb8bcc81f6472d51b14a
                break;
            case 'address':
                window.open($ExpURL+'/address/'+$Data);
                // https://explorer.testnet.oxochain.com/address/0xe0289c0c19a3e3423adbf4c328ce8e6495400000
                break;
            default:
        }
    });


    $('[data-toggle="offcanvas"]').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    });



    // try {
    //     //web3 = new Web3(new Web3.providers.HttpProvider("https://rpc.testnet.oxochain.com"));
    //     getChainId();
    //     $.OXO.request._getBlockNumber();
    // } catch (error) {
    //     alert(error)
    // }
});

/********************************************************
    WINDOW LOAD
********************************************************/
$(window).on('load', function() {
    console.log('jQuery: Window Loaded');

});