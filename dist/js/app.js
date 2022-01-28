/********************************************************
    READY
********************************************************/
$(document).ready(function() {
    console.log('jQuery: Window Ready');

    let $TestLocal = false;
    if(location.origin==='file://'){
        $TestLocal = true;
    }

    let $Body = $('body');
    let currentAccount=null, web3, m, contractAddress, chainId;
    let erc20ABI, erc20Token;
    let contractSymbol,contractDecimals,contractFirst,contractName;
    let stakeTokenContractAddress ="0xa844347E8DdDeE34a5c014626644CBa30231b6e2";
    let stakeTokenABI,stakeToken;

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

    /*
        Fetch JSON File
    */
    // $.getJSON("ERC20.json", function (result) {
    //   erc20ABI = result.abi;
    // });
    // $.getJSON("StakeToken.json", function (result) {
    //   stakeTokenABI = result.abi;
    // });
    if($TestLocal==false){
        $.when($.getJSON('/ERC20.json'), $.getJSON('/StakeToken.json')).done(function(file1Result,file2Result){
            console.log('JSON Files Loaded!');
            erc20ABI        = file1Result[0];
            stakeTokenABI   = file2Result[0];
        });
    }

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

        if (chainId !== cId) window.location.reload();

        chainId = cId;
    };

    /*
        
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
                getBalance(currentAccount);
                getChainId();
                getBlockNumber();
            }
        }
        console.log(
            "WalletAddress in HandleAccountChanged [" + currentAccount + "]"
        );
    };

    /*
        
    */
    function connect() {
        console.log("connect()");
        if($TestLocal==true){return false;}

        try {
            web3 = new Web3(window.ethereum);
            //web3 = new Web3(new Web3.providers.HttpProvider("https://rpc.testnet.oxochain.com"));
            //getChainId();
            //getBlockNumber();
        } catch (error) {
            alert(error);
        }

        ethereum
            .request({ method: "net_version" })
            .then(function(result) {
                handleChainChanged;
            })
            .catch((err) => {
                console.error(err);
            });

        ethereum
            .request({ method: "eth_requestAccounts" })
            .then(handleAccountsChanged)
            .catch((err) => {
                if (err.code === 4001) {
                    // EIP-1193 userRejectedRequest error
                    // If this happens, the user rejected the connection request.
                    console.log("Please connect to MetaMask.");
                    $("#status").html("You refused to connect Metamask");
                } else {
                    console.error(err);
                }
            });
    };

    /*
        
    */
    function detectMetaMask() {
        console.log("detectMetaMask()");
        if (typeof window.ethereum !== "undefined") {
            ethereum.on("accountsChanged", handleAccountsChanged);
            ethereum.on("chainChanged", handleChainChanged);
            ethereum.on("disconnet", handleDisconnect);
            console.log(ethereum);
            return true;
        } else {
            console.log("Metamask is not installed!");
            return false;
        }
    };

    /*
        
    */
    async function getBlockNumber() {
        console.log("getBlockNumber()");
        const latestBlockNumber = await web3.eth.getBlockNumber();
        /*    try {
        var latestBlockNumber = await ethereum.request({
        method: 'eth_blockNumber'
        });
        } catch (error) {
        console.log('Error: ' + error);
        }
        */
        console.log("Block Number: " + latestBlockNumber);
        $("#blocknumber").html(latestBlockNumber);
        return latestBlockNumber;
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
        return chainId;
    };

    /*
        
    */
    async function getTokenInfo() {
        console.log("getTokenInfo");

        let _contractAddress = $("#contractaddress").val().trim();
        
        $('#contractaddress').addClass('loading'); /* Loadin Effect */

        $('#TokenResults i').html('...');
        
        $('[data-cms="addToMetaMask"]').attr('disabled', true);
        // $("#getName").html("");
        // $("#getSymbol").html("");
        // $("#getDecimals").html("");
        // $("#getName").html("");
        // $("#btnToken").html("Add Token to Metamask");
        // $("#contractAddress").html("");
        // $("#tokenInfo").hide();
        try {
            web3.eth.getCode(_contractAddress).then(function(result) {
                if (result == "0x") {
                    Swal.fire({
                      title: 'Oooppsy',
                      text: 'This is not a contract Address...',
                      icon: 'error'
                    });
                    
                    $("#contractaddress").val("0x");
                }else if(result != "0x"){
                    var contractFirst = new web3.eth.Contract(
                        erc20ABI,
                        _contractAddress
                    );

                    erc20Token = contractFirst;
                    contractAddress = _contractAddress;
                    $("#tokenInfo").show();
                    $("#contractAddress").html(contractAddress);

                    let TI_Name     = getName(erc20Token);
                    let TI_Symbol   = getSymbol(erc20Token);
                    let TI_Decimals = getDecimals(erc20Token);
                    let TI_Address  = _contractAddress;

                    $('#TI_Name').html( TI_Name );
                    $('#TI_Symbol').html( TI_Symbol );
                    $('#TI_Decimals').html( TI_Decimals );
                    $('#TI_Address').html( _contractAddress );

                    let $AddTokenData = {
                        "tokenAddress"  : _contractAddress, 
                        "tokenSymbol"   : TI_Symbol, 
                        "tokenDecimals" : TI_Decimals, 
                        "tokenImage"    : ""
                    };

                    $('[data-cms="addToMetaMask"]').attr('disabled', false).attr("data-param",  JSON.stringify($AddTokenData) );
                }
            });
        } catch (error) {
            Swal.fire({
              title: 'Ethereum Error',
              text: error,
              icon: 'error'
            });
        }
    };

    /*
        
    */
    async function getSymbol(tokenData) {
        console.log("getSymbol();");
        try {
            tokenData.methods
                .symbol()
                .call()
                .then(function(result) {
                    contractSymbol = result;
                    return contractSymbol
                });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function getDecimals(tokenData) {
        console.log("getDecimals();");
        try {
            tokenData.methods
                .decimals()
                .call()
                .then(function(result) {
                    contractDecimals = result;
                    return contractDecimals;
                });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function getName(tokenData) {
        console.log("getName();");
        try {
            tokenData.methods
                .name()
                .call()
                .then(function(result) {
                    $("#btnToken").html('Add  "' + result + '" to Metamask');
                    contractName = result;
                    return contractName;
                });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function Send5Money() {
        try {
            let value = web3.utils.toWei('5', 'ether');
            web3.eth.sendTransaction({ to: '0xd7cE0CdacCaaDd386d7873b09797748715AA3572', from: web3.eth.givenProvider.selectedAddress, value: value }).then(function(result) {
                console.log(result);
            });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function getStakeToken() {
        if (stakeToken == null) {
            try {
                stakeToken = new web3.eth.Contract(
                    stakeTokenABI,
                    stakeTokenContractAddress
                );
            } catch (error) {
                console.log("Error: " + error);
            }
        }
    };

    /*
        
    */
    async function addBlacklist() {
        console.log("addBlacklist()");
        toAddress = $("#toAddress").val().trim();
        if (web3.utils.isAddress(toAddress)) {
            try {
                web3.eth.getCode(toAddress).then(function(result) {
                    if (result == "0x") {
                        getStakeToken();
                        stakeToken.methods
                            .addToBlacklist(toAddress)
                            .send({ from: web3.givenProvider.selectedAddress })
                            .then(function(result) {
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
    async function removeBlacklist() {
        console.log("removeBlacklist()");
        toAddress = $("#toAddress").val().trim();
        if (web3.utils.isAddress(toAddress)) {
            try {
                web3.eth.getCode(toAddress).then(function(result) {
                    if (result == "0x") {
                        getStakeToken();
                        stakeToken.methods
                            .removeFromBlacklist(toAddress)
                            .send({ from: web3.givenProvider.selectedAddress })
                            .then(function(result) {
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
            stakeToken.methods
                .totalRewarded()
                .call()
                .then(function(result) {
                    $("#totalRewardedSpan").html(web3.utils.fromWei(result, "ether"));
                    console.log(result);
                });
        } catch (error) {
            console.log("Error: " + error);
        }
    };

    /*
        
    */
    async function getBalance() {
        console.log("getBalance()");
        var getBalanceResult = 0;
        try {
            web3.eth.getBalance(currentAccount).then(function(result) {
                var symbol = "MONEY";
                if (NetworkInfo[chainId] != undefined)
                    symbol = NetworkInfo[chainId].symbol;
                $("#balance").html(
                    web3.utils.fromWei(result, "ether") + " " + symbol
                );
            });
        } catch (error) {
            console.log("Error: " + error);
        }
        return getBalanceResult;
    };

    /*
        
    */
    async function addToMetamask() {
        console.log("addToMetamask()");
        const tokenAddress = contractAddress;
        const tokenSymbol = contractSymbol;
        const tokenDecimals = contractDecimals;
        const tokenImage = "";

        try {
            // wasAdded is a boolean. Like any RPC method, an error may be thrown.
            const wasAdded = await ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20", // Initially only supports ERC20, but eventually more!
                    options: {
                        address: tokenAddress, // The address that the token is at.
                        symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
                        decimals: tokenDecimals, // The number of decimals in the token
                        image: tokenImage, // A string url of the token logo
                    },
                },
            });

            if (wasAdded) {
                console.log("Thanks for your interest!");
            } else {
                console.log("Your loss!");
            }
        } catch (error) {
            console.log(error);
        }
    };


    /*
        
    */
    async function addNetworkToMetaMask(_chainId) {
        console.log("addNetworkToMetaMask(Arguments)");
        console.log(arguments);
        if (NetworkInfo[_chainId] != undefined) {
            var HexChainId = web3.utils.toHex(_chainId); //
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
                    } catch (addError) {
                        console.log("Did not add network");
                    }
                }
            }
        }
    };


    /*
        
    */
    // async function addOxoNetwork() {
    //     console.log('addOxoNetwork(1881)');
    //     addNetworkToMetaMask(1881);
    // };

    /*
        
    */
    // async function addOxoTestnetNetwork() {
    //     console.log('addOxoTestnetNetwork(91881)');
    //     addNetworkToMetaMask(91881);
    // };

    m = detectMetaMask();
    
    function toggleConnection(){
        if($TestLocal==true){
            $Body.removeClass('not-connected').addClass('connected');
            $('.ConnectStatus').html('Local Test').attr("disabled", true).removeClass('bg-success').addClass('bg-info');
            return false;
        };

        if(m){
            $Body.removeClass('not-connected').addClass('connected');
            $('.ConnectStatus').html('Disconnec').attr("disabled", false).removeClass('bg-danger').addClass('bg-success')
        }else{
            $('.ConnectStatus').html('Connect Wallet').attr("disabled", true).removeClass('bg-success').addClass('bg-danger');
        }
    };
    toggleConnection();

    $("#tokenInfo").hide();

    /*
        Command Palette
    */
    $Body.on('click', '[data-cmd]', function(event) {
        event.preventDefault();

        /*
            Check MetaMask
        */
        if($TestLocal==false){
            if(!window.ethereum){
                Swal.fire({
                  title: 'Oooppsy',
                  text: 'MetaMask support was not found in your browser.',
                  icon: 'error'
                });
                return false;
            };
        };

        let $Command    = $(this).data('cmd');
        let $Data       = $(this).data('param') ? JSON.parse($(this).attr('data-param')) : {};

        console.log($Data)
        console.table($Data)

        switch($Command) {
            case 'ConnectMetaMask':
                connect();
                break;
            case 'getTokenInfo':
                getTokenInfo();
                break;
            case 'addToMetaMask':
                addToMetamask();
                break;
            case 'addNetwork':
                let $NetworkPort 
                addNetworkToMetaMask( $Data.Port ); // addNetworkToMetaMask(1881);
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

    $("#getTokenInfo").click(function() {
        getTokenInfo();
    });

    $("#addToMetamask").click(function() {
        addToMetamask();
    });

    $("#addMain").click(function() {
        addNetworkToMetaMask(1881);
    });

    $("#addTest").click(function() {
        addNetworkToMetaMask(91881);
    });

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

    // try {
    //     //web3 = new Web3(new Web3.providers.HttpProvider("https://rpc.testnet.oxochain.com"));
    //     getChainId();
    //     getBlockNumber();
    // } catch (error) {
    //     alert(error)
    // }

    $('[data-toggle="offcanvas"]').on('click', function () {
        $('.offcanvas-collapse').toggleClass('open')
    });
});

/********************************************************
    WINDOW LOAD
********************************************************/
$(window).on('load', function() {
    console.log('jQuery: Window Loaded');

});