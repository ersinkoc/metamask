window.app = {}

let $Body = $('body');
let currentAccount=null, contractAddress, chainId;
let symbol="MONEY";
let contractSymbol,contractDecimals,contractFirst,contractName;

const NetworkInfo = {
    1: {
        chainName: "Ethereum Main Net",
        chainId: 0x1,
        name: "Ether",
        symbol: "ETH",
        decimals: 18,
        rpcUrls: {
            0: "https://mainnet.infura.io/v3/b38821aa1dfb47fe8bf1adad521e1afc",
        },
        blockExplorerUrls: { 0: "https://etherscan.io" },
    },
    1881: {
        chainName: "OXO Chain Main",
        chainId: 0x759,
        name: "OXO",
        symbol: "OXO",
        decimals: 18,
        rpcUrls: { 0: "https://rpc.oxochain.com" },
        blockExplorerUrls: { 0: "https://explorer.oxochain.com" },
    },
    91881: {
        chainName: "OXO Chain Test",
        chainId: 0x166e9,
        name: "Test OXO",
        symbol: "TOXO",
        decimals: 18,
        rpcUrls: { 0: "https://rpc.testnet.oxochain.com" },
        blockExplorerUrls: { 0: "https://explorer.testnet.oxochain.com" },
    },
};

/********************************************************
    READY
********************************************************/
$(document).ready(function() {
    console.log('jQuery: Window Ready!');

    /*
        OXO.Script
        $.OXO.data.CurrentTokenData
    */
    $.OXO = {
        Web3: null,
        data:{
            IsTest          : (location.origin==='file://' ? true : false),
            web3            : null,
            currentAccount  : null, 
            IsMetaMask      : null,
            contractAddress : null,
            chainId         : null,
            erc20ABI        : {},
            stakeTokenABI   : {},
            stakeToken      : null,
            CurrentTokenData: {}
        },

        init: function(){
            if($.OXO.data.IsTest==false){
                $.getJSON("ERC20.json", function (result) {
                    $.OXO.data.erc20ABI = result.abi;
                });
                $.getJSON("StakeToken.json", function (result) {
                    $.OXO.data.stakeTokenABI = result.abi;
                });
            }
        },

        stake: {
            ContractAddress: "0xa844347E8DdDeE34a5c014626644CBa30231b6e2",
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

        handlers:{

        },

        request:{
            _getBlockNumber: async function(){
                console.log("$.OXO.request._getBlockNumber()");
                // try {
                //     var latestBlockNumber = await ethereum.request({
                //         method: 'eth_blockNumber'
                //     });
                // } catch (error) {
                //     console.log('Error: ' + error);
                // };

                const latestBlockNumber = await $.OXO.Web3.eth.getBlockNumber();
                console.log("Latest Block Number: " + latestBlockNumber);
                $("#LatesBlockNumber").html(latestBlockNumber);
                
                return latestBlockNumber;
            }
        },

        tools:{
            error   : function(Msg){ Swal.fire({title: 'Error', text: Msg, icon: 'error'}); },
            info    : function(Msg){ Swal.fire({title: 'Info', text: Msg, icon: 'info'}); },
            success : function(Msg){ Swal.fire({title: 'Success', text: Msg, icon: 'success'}); },
            /*--------------------------------------------------

            --------------------------------------------------*/
            toggleConnection: function(){
                console.log("OXO.tools.toggleConnection()");
                
                if($.OXO.data.IsTest == true){
                    $Body.removeClass('not-connected').addClass('connected');
                    $('.ConnectStatus').html('Local Test').attr("disabled", true).removeClass('bg-success').addClass('bg-info');
                    return false;
                };

                if($.OXO.data.IsMetaMask == true){
                    $Body.removeClass('not-connected').addClass('connected');
                    $('.ConnectStatus').html('Disconnect').attr("disabled", false).removeClass('bg-danger').addClass('bg-success')

                    if($.OXO.Web3 == null){
                        $.OXO.connect();
                    };
                }else{
                    $('.ConnectStatus').html('Connect Wallet').attr("disabled", true).removeClass('bg-success').addClass('bg-danger');
                }

                if(($("#WalletConnectionModal").data('bs.modal') || {})._isShown){
                    $("#WalletConnectionModal").modal('hide');
                }
            },
            /*--------------------------------------------------

            --------------------------------------------------*/
            IsMetaMask: async function(){
                console.log("OXO.tools.IsMetaMask()");

                return new Promise(function (resolve, reject) {
                    if (typeof window.ethereum !== "undefined") {
                        ethereum.on("accountsChanged", handleAccountsChanged);
                        ethereum.on("chainChanged", handleChainChanged);
                        ethereum.on("disconnet", handleDisconnect);
                        console.log('detectMetaMask ethereum: ', ethereum);
                        
                        $.OXO.data.IsMetaMask = true;
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
                return $.OXO.Web3.utils.fromWei(Val, "ether") + " " + symbol
            }
            /*--------------------------------------------------
            
            --------------------------------------------------*/
        },
        connect : function(){
            console.log("OXO.connect();");
            if($.OXO.data.IsTest){return false;}

            try {
                $.OXO.Web3 = new Web3(window.ethereum);
                // web3 = new Web3(new Web3.providers.HttpProvider("https://rpc.testnet.oxochain.com"));
                // getChainId();
                // $.OXO.request._getBlockNumber();
            } catch (error) {
                $.OXO.tools.error(error);
                return false
            }

            ethereum.request({ method: "net_version" }).then(function(result) {
                handleChainChanged;
            })
            .catch((err) => {
                console.error(err);
                return false
            });

            ethereum.request({ method: "eth_requestAccounts" }).then(handleAccountsChanged)
            .catch((err) => {
                if (err.code === 4001) {
                    // EIP-1193 userRejectedRequest error
                    // If this happens, the user rejected the connection request.
                    console.log("Please connect to MetaMask.");
                    $("#status").html("You refused to connect Metamask");
                } else {
                    console.error(err);
                    return false
                }
            });

            $.OXO.toggleConnection();
            // $.OXO.Tools.toggleConnection();
        }
    };
    $.OXO.init();

    $.OXO.tools.IsMetaMask().then(function(result) {
        console.log('IsMetaMask:', result);

        $.OXO.tools.toggleConnection();
    });



























    /*
        handle Disconnect
    */
    function handleDisconnect() {
        console.log("handleDisconnect()");
        window.location.reload();
    };

    /*
        
    */
    function handleChainChanged(chain) {
        console.log("handleChainChanged(" + chain + ")");
        cId = parseInt(chain, 16);

        if (chainId !== cId){
            window.location.reload()
            return false;
        };

        chainId = cId;
        
        SetNetworkInfo('handleChainChanged');
    };
    function SetNetworkInfo(fName){
        console.log('chainId: ', fName, chainId);

        if (NetworkInfo[chainId] !== 'undefined') {
            let $ChainData = NetworkInfo[chainId];

            $('#ChainName').html( $ChainData.chainName );
            $('#ChainId').html( $ChainData.chainId );
            $('#TokenName').html( $ChainData.name );
            $('#TokenSymbol').html( $ChainData.symbol );
            $('#TokenDecimal').html( $ChainData.decimals );
            $('#RpcUrl').html( $ChainData.rpcUrls );

            var ExplorerURLs = Object.keys(NetworkInfo[chainId].rpcUrls).map(function(k) { 
                return '<a href="'+ NetworkInfo[chainId].rpcUrls[k] +'" target="_blank" class="btn btn-sm btn-primary">'+ NetworkInfo[chainId].rpcUrls[k]  +'</a>'
            }).join("<br>");
            $('#Explorer').html(ExplorerURLs);

            $('a[data-cmd="ChangeNetwork"]').removeClass('btn-success');
            $('a[data-cmd="ChangeNetwork"][data-id="'+ chainId +'"]').addClass('btn-success');
        }
    }

    /*
        Account Changed Handler
    */
    function handleAccountsChanged(accounts) {
        console.log("handleAccountsChanged(" + accounts + ")");

        if (accounts.length === 0) {
            console.log("Please connect to MetaMask.");
            $("#enableMetamask").html("Connect with Metamask");
            $("#balance").html("...");
            $("#networkid").html("...");
        } else if (accounts[0] !== currentAccount) {
            currentAccount = accounts[0];
            $("#enableMetamask").html(currentAccount);
            $("#status").html("");
            if (currentAccount != null) {
                // Set the button label
                $("#enableMetamask").html(currentAccount);
                
                getBalance(currentAccount).then(function(result) {

                    $('#wallet_balance').html( ConvertWei(result) );
                });
                
                getChainId();
                $.OXO.request._getBlockNumber();
            }
        }
        console.log(
            "WalletAddress in HandleAccountChanged [" + currentAccount + "]"
        );
    };


    /*
        
    */
    async function getChainId() {
        console.log("getChainId()");
        //chainId = await web3.eth.net.getId() // From web3 rpc
        chainId = await window.ethereum.networkVersion; // From Metamask
        console.log("Network ID: " + chainId);

        if (NetworkInfo[chainId] != undefined) {
            $("#networkid").html(
                chainId + " (" + NetworkInfo[chainId].chainName + ")"
            );
        } else {
            $("#networkid").html(chainId + " (Unknown Network)");
        }

        SetNetworkInfo('connect');
        
        return chainId;
    };

    /*
        
    */
    async function getTokenInfo(_contractAddress) {
        console.log("getTokenInfo");
        
        $('#contractaddress').addClass('loading'); /* Loadin Effect */

        $('#TokenResults i').html('...');
        
        $('[data-cmd="addToMetaMask"]').attr({
            'disabled'      : true,
            'data-param'    : '{}'
        })
        .html('Add Token to Metamask')
        .removeClass('btn-success').addClass('btn-warning')

        try {
            $.OXO.Web3.eth.getCode(_contractAddress).then(function(result) {
                if (result == "0x") {
                    $.OXO.tools.error('This is not a contract address...');
                    
                    $("#contractaddress").val("0x");
                }else if(result != "0x"){
                    $('#contractaddress').removeClass('loading');

                    let contractFirst = new $.OXO.Web3.eth.Contract(
                        $.OXO.data.erc20ABI,
                        _contractAddress
                    );

                    contractAddress = _contractAddress;

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

                        $('[data-cmd="addToMetaMask"]')
                            .removeClass('btn-warning')
                            .addClass('btn-success')
                            .attr({
                                'disabled'  : false,
                                'data-param': JSON.stringify( $.OXO.data.CurrentTokenData )
                            });
                        
                        $('#TI_Name').html( $.OXO.data.CurrentTokenData.tokenName );
                        $('#TI_Symbol').html( $.OXO.data.CurrentTokenData.tokenSymbol );
                        $('#TI_Decimals').html( $.OXO.data.CurrentTokenData.tokenDecimals );
                        $('#TI_Address').html( $.OXO.data.CurrentTokenData.tokenAddress );
                    });
                }
            });
        } catch (error) { $.OXO.tools.error(error); }
    };

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
        
    */
    async function Send5Money() {
        try {
            let value = $.OXO.Web3.utils.toWei('5', 'ether');
            $.OXO.Web3.eth.sendTransaction({ 
                to      : '0xd7cE0CdacCaaDd386d7873b09797748715AA3572', 
                from    : $.OXO.Web3.eth.givenProvider.selectedAddress, 
                value   : value 
            }).then(function(result) {
                console.log(result);
            });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function addBlacklist() {
        console.log("addBlacklist()");
        toAddress = $("#toAddress").val().trim();
        if ($.OXO.Web3.utils.isAddress(toAddress)) {
            try {
                $.OXO.Web3.eth.getCode(toAddress).then(function(result) {
                    if (result == "0x") {
                        $.OXO.stake._getStakeToken().then(function(){
                            
                            $.OXO.data.stakeToken.methods
                                .addToBlacklist(toAddress)
                                .send({ 
                                    from: $.OXO.Web3.givenProvider.selectedAddress 
                                }).then(function(result) {
                                    console.log('addBlacklist: ', result);
                                });
                        });
                    } else {
                        console.log("Address is a contract");
                        $("#toAddress").val("0xdead000123");
                    }
                });
            } catch (error) {
                $("#toAddress").val("0xdead000999");
                console.log("Error: " + error);
            }
        }
    };

    /*
        
    */
    async function removeBlacklist() {
        console.log("removeBlacklist()");
        toAddress = $("#toAddress").val().trim();
        if ($.OXO.Web3.utils.isAddress(toAddress)) {
            try {
                $.OXO.Web3.eth.getCode(toAddress).then(function(result) {
                    if (result == "0x") {
                        getStakeToken();
                        $.OXO.data.stakeToken.methods
                            .removeFromBlacklist(toAddress)
                            .send({ 
                                from: $.OXO.Web3.givenProvider.selectedAddress 
                            }).then(function(result) {
                                console.log(result);
                            });
                    } else {
                        console.log("Address is a contract");
                        $("#toAddress").val("0xdead000123");
                    }
                });
            } catch (error) {
                $("#toAddress").val("0xdead000999");
                console.log("Error: " + error);
            }
        }
    };

    /*
        
    */
    async function totalRewarded() {
        console.log("totalRewarded()");
        try {
            getStakeToken();
            
            $.OXO.data.stakeToken.methods
                .totalRewarded()
                .call()
                .then(function(result) {
                    $("#totalRewardedSpan").html( $.OXO.Web3.utils.fromWei(result, "ether") );
                    console.log(result);
                });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    function getBalance() {
        console.log("getBalance()");
        return new Promise(function (resolve, reject) {
            try {
                $.OXO.Web3.eth.getBalance(currentAccount).then(function(result) {
                    /* Set Symbol */
                    if (NetworkInfo[chainId] != undefined){
                        symbol = NetworkInfo[chainId].symbol
                    };
                    // resolve($.OXO.Web3.utils.fromWei(result, "ether") + " " + symbol)
                    resolve(result)
                    // $("#balance").html();
                });
            } catch (error) {
                console.log("Error: " + error);
                reject(error);
            }
        });
        // return getBalanceResult;
    };
    function ConvertWei(Val){
        return $.OXO.Web3.utils.fromWei(Val, "ether") + " " + symbol
    }

    /*
        
    */
    async function addToMetamask(data) {
        console.log("addToMetamask() => ", data );

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
    };


    /*
        
    */
    async function ChangeNetwork(_chainId) {
        console.log("ChangeNetwork(Arguments)");
        console.log(arguments);
        if (NetworkInfo[_chainId] != undefined) {
            var HexChainId = $.OXO.Web3.utils.toHex(_chainId); //
            try {
                await ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: HexChainId }], // Hexadecimal version of ..., prefixed with 0x
                });
            } catch (error) {
                if (error.code === 4902) {
                    try {
                        await ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [{
                                chainId: HexChainId, // Hexadecimal version of ... , prefixed with 0x
                                chainName: NetworkInfo[_chainId].chainName,
                                nativeCurrency: {
                                    name: NetworkInfo[_chainId].name,
                                    symbol: NetworkInfo[_chainId].symbol,
                                    decimals: NetworkInfo[_chainId].decimals,
                                },
                                rpcUrls: [NetworkInfo[_chainId].rpcUrls[0]],
                                blockExplorerUrls: [
                                    NetworkInfo[_chainId].blockExplorerUrls[0],
                                ],
                                iconUrls: [NetworkInfo[_chainId].iconUrls],
                            }, ],
                        });
                    } catch (addError) { $.OXO.tools.error('Did not add network'); }
                }
            }
        }else{
            console.log('NetworkInfo[_chainId]=undefined');
        }
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
            case 'ConnectMetaMask':
                $.OXO.connect();
                break;
            case 'getTokenInfo':
                getTokenInfo( $("#contractaddress").val().trim() );
                break;
            case 'addToMetaMask':
                addToMetamask( $Data );
                break;
            case 'ChangeNetwork':
                let $NetworkPort 
                ChangeNetwork( $Data.chainId );
                break;
            case 'addToBlackList':
                addBlacklist();
                break;
            case 'RemoveFromBlackList':
                removeBlacklist();
                break;
            case 'CopyTokenToInfoInput':
                $('#contractaddress').val( $Data.value );
                break;
            default:
        }
        event.preventDefault();
        /* Act on the event */
    });
    // $("#ConnectMetaMask").click(function() {
    //     connect();
    // });

    // $("#getTokenInfo").click(function() {
    //     getTokenInfo();
    // });

    // $("#addToMetamask").click(function() {
    //     addToMetamask();
    // });

    // $("#addMain").click(function() {
    //     ChangeNetwork(1881);
    // });

    // $("#addTest").click(function() {
    //     ChangeNetwork(91881);
    // });

    $("#toBlacklist").click(function() {
        addBlacklist();
    });

    $("#removeBlacklist").click(function() {
        removeBlacklist();
    });

    $("#totalRewarded").click(function() {
        totalRewarded();
    });

    $("#Send5Money").click(function() {
        Send5Money();
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