var Monopoly = {};
Monopoly.allowRoll = true;
Monopoly.moneyAtStart = 100;
Monopoly.doubleCounter = 0;

Monopoly.init = function(){
    $(document).ready(function(){
        Monopoly.adjustBoardSize();
        $(window).bind("resize",Monopoly.adjustBoardSize);
        Monopoly.initDice();
        Monopoly.initPopups();
        Monopoly.start();        
    });
};

Monopoly.start = function(){
    Monopoly.showPopup("intro")
};


Monopoly.initDice = function(){                                         //setting an event listener on the dice that is activated when no player moves on the board
    $(".dice").click(function(){
        if (Monopoly.allowRoll){
            Monopoly.rollDice();
        }
    });
};


Monopoly.getCurrentPlayer = function(){                                 //getting the id of player that plays now
    return $(".player.current-turn");
};

Monopoly.getPlayersCell = function(player){                             //getting the name of the card that the player is standing on
    return player.closest(".cell");
};


Monopoly.getPlayersMoney = function(player){                            //getting the amount of money the player has
    return parseInt(player.attr("data-money"));
};



Monopoly.updatePlayersMoney = function(player,amount){
    var playersMoney = parseInt(player.attr("data-money"));
    playersMoney -= amount;
    if (playersMoney <= 5 ){
        alert("you are broke! bye!");
            // Monopoly.showPopup("bankruptcy");
        //removing the players css
        $(".cell." + player.attr("id")).removeClass(player.attr("id")).addClass("available");
        player.addClass("broke");
        if(player === "broke") {
            player.removeClass();
        }
    }
    player.attr("data-money",playersMoney);
    player.attr("title",player.attr("id") + ": $" + playersMoney);
    Monopoly.playSound("chaching");
};


Monopoly.rollDice = function(){                                                                         //randomizing the dice number between 1-6.
    var result1 = Math.floor(Math.random() * 6) + 1 ;
    var result2 = Math.floor(Math.random() * 6) + 1 ;
    $(".dice").find(".dice-dot").css("opacity",0);                                                     //the dice have no number to start with (opacity 100%)
    $(".dice#dice1").attr("data-num",result1).find(".dice-dot.num" + result1).css("opacity",1);         //adding the css attribute of the number that was randomized for each die.
    $(".dice#dice2").attr("data-num",result2).find(".dice-dot.num" + result2).css("opacity",1);
    if (result1 == result2){                                                                            //if the number is the same than count the doubles (for geekout).
        Monopoly.doubleCounter++;
    }
    var currentPlayer = Monopoly.getCurrentPlayer();
    Monopoly.handleAction(currentPlayer,"move",result1 + result2);                                       //animate the player's movements based on the sum of dice.
};


Monopoly.movePlayer = function(player,steps){
    Monopoly.allowRoll = false;
    var playerMovementInterval = setInterval(function(){
        if (steps == 0){
            clearInterval(playerMovementInterval);
            Monopoly.handleTurn(player);
        }else{
            var playerCell = Monopoly.getPlayersCell(player);
            var nextCell = Monopoly.getNextCell(playerCell);
            nextCell.find(".content").append(player);
            steps--;
        }
    },200);
};


Monopoly.handleTurn = function(){
    var player = Monopoly.getCurrentPlayer();
    var playerCell = Monopoly.getPlayersCell(player);
    if (playerCell.is(".available.property")){
        Monopoly.handleBuyProperty(player,playerCell);

    }else if(playerCell.is(".property:not(.available)") && !playerCell.hasClass(player.attr("id"))){
        console.log("not my property!!!!!");
        Monopoly.handlePayRent(player,playerCell);
    }
    else if(playerCell.is(".property:not(.available)") && playerCell.hasClass(player.attr("id"))){
        var currentPlayerTurn = Monopoly.getCurrentPlayer();
        currentPlayerTurn.addClass("myProperty");
        Monopoly.setNextPlayerTurn();
    }
    else if(playerCell.is(".go-to-jail")){
        var currentPlayerTurn = Monopoly.getCurrentPlayer();
        currentPlayerTurn.addClass("jailTime");
        Monopoly.handleGoToJail(player);
    }
    else if(playerCell.is(".chance")){
        Monopoly.handleChanceCard(player);
    }
    else if(playerCell.is(".community")){
        Monopoly.handleCommunityCard(player);
    }
    else{
        Monopoly.setNextPlayerTurn();
    }
};

Monopoly.setNextPlayerTurn = function(){

    var currentPlayerTurn = Monopoly.getCurrentPlayer();                            //get the current player
    var playerId = parseInt(currentPlayerTurn.attr("id").replace("player",""));     //clear the id of that player so it's ready for the nest player in turn
    var nextPlayerId = playerId + 1;                                                //set the "current player" to the next player.
    if (nextPlayerId > $(".player").length){                                        //when getting to the last player, set the current to player #1 once again
        nextPlayerId = 1;
    }
    currentPlayerTurn.removeClass("current-turn");                                  //set the id of "current" to the next player
    var nextPlayer = $(".player#player" + nextPlayerId);
    nextPlayer.addClass("current-turn");
    if (nextPlayer.is(".jailed")){                                                  //if the next player is in jail, count every time it's their turn and they're in jail.
        var currentJailTime = parseInt(nextPlayer.attr("data-jail-time"));
        currentJailTime++;
        nextPlayer.attr("data-jail-time",currentJailTime);
        if (currentJailTime > 3){                                                    //if he sat in jail for 3 turns, we remove his jail class, and he get's a regular turn
            nextPlayer.removeClass("jailed");
            nextPlayer.removeAttr("data-jail-time");
        }
        Monopoly.setNextPlayerTurn();
        return;
    }
    Monopoly.closePopup();
    Monopoly.allowRoll = true;
};


Monopoly.handleBuyProperty = function(player,propertyCell){
    var propertyCost = Monopoly.calculateProperyCost(propertyCell);                   //
    var popup = Monopoly.getPopup("buy");
    popup.find(".cell-price").text(propertyCost);
    popup.find("button").unbind("click").bind("click",function(){
        var clickedBtn = $(this);
        if (clickedBtn.is("#yes")){
            Monopoly.handleBuy(player,propertyCell,propertyCost);
        }else{
            Monopoly.closeAndNextTurn();
        }
    });
    Monopoly.showPopup("buy");
};

Monopoly.handlePayRent = function(player,propertyCell){
    var popup = Monopoly.getPopup("pay");
    var currentRent = parseInt(propertyCell.attr("data-rent"));
    var properyOwnerId = propertyCell.attr("data-owner");
    popup.find("#player-placeholder").text(properyOwnerId);
    popup.find("#amount-placeholder").text(currentRent);
    popup.find("button").unbind("click").bind("click",function(){
        var properyOwner = $(".player#"+ properyOwnerId);
        console.log(properyOwnerId);
        Monopoly.updatePlayersMoney(player,currentRent);
        Monopoly.updatePlayersMoney(properyOwner,-1*currentRent);
        Monopoly.closeAndNextTurn();
    });
   Monopoly.showPopup("pay");
};


Monopoly.handleGoToJail = function(player){
    var popup = Monopoly.getPopup("jail");
    popup.find("button").unbind("click").bind("click",function(){
        Monopoly.handleAction(player,"jail");
    });
    Monopoly.showPopup("jail");
};



Monopoly.handleChanceCard = function(player){
    var popup = Monopoly.getPopup("chance");
    popup.find(".popup-content").addClass("loading-state");
    $.get("https://itcmonopoly.appspot.com/get_random_chance_card", function(chanceJson){
        popup.find(".popup-content .text-placeholder").text(chanceJson["content"]);
        popup.find(".popup-title").text(chanceJson["title"]);
        popup.find(".popup-content").removeClass("loading-state");
        popup.find(".popup-content button").attr("data-action",chanceJson["action"]).attr("data-amount",chanceJson["amount"]);
    },"json");
    popup.find("button").unbind("click").bind("click",function(){
        var currentBtn = $(this);
        var action = currentBtn.attr("data-action");
        var amount = currentBtn.attr("data-amount");
        console.log("testing the action and amount " + action + " " + amount);
        Monopoly.handleAction(player,action,amount);
    });
    Monopoly.showPopup("chance");
};

Monopoly.handleCommunityCard = function(player){
    //TODO: implement this method
    alert("not implemented yet!");

    Monopoly.handleCommunityCard = function(player){
        var popup = Monopoly.getPopup("community");
        popup.find(".popup-content").addClass("loading-state");
        $.get("https://itcmonopoly.appspot.com/get_random_community_card", function(communityJson){
            popup.find(".popup-content .text-placeholder").text(communityJson["content"]);
            popup.find(".popup-title").text(communityJson["title"]);
            popup.find(".popup-content").removeClass("loading-state");
            popup.find(".popup-content button").attr("data-action",communityJson["action"]).attr("data-amount",communityJson["amount"]);
        },"json");
        popup.find("button").unbind("click").bind("click",function(){
            var currentBtn = $(this);
            var action = currentBtn.attr("data-action");
            var amount = currentBtn.attr("data-amount");
            console.log("testing the action and amount " + action + " " + amount);
            Monopoly.handleAction(player,action,amount);
        });
        // Monopoly.showPopup("community");
    };
    Monopoly.setNextPlayerTurn();
};


Monopoly.sendToJail = function(player){
    player.addClass("jailed");
    player.attr("data-jail-time",1);
    $(".corner.game.cell.in-jail").append(player);
    Monopoly.playSound("woopwoop");
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};


Monopoly.getPopup = function(popupId){
    return $(".popup-lightbox .popup-page#" + popupId);
};

Monopoly.calculateProperyCost = function(propertyCell){
    var cellGroup = propertyCell.attr("data-group");
    var cellPrice = parseInt(cellGroup.replace("group","")) * 5;
    if (cellGroup == "rail"){
        cellPrice = 10;
    }
    return cellPrice;
};


Monopoly.calculateProperyRent = function(propertyCost){
    return propertyCost/2;
};


Monopoly.closeAndNextTurn = function(){
    Monopoly.setNextPlayerTurn();
    Monopoly.closePopup();
};

Monopoly.initPopups = function(){
    $(".popup-page#intro").find("button").click(function(){
        var numOfPlayers = $(this).closest(".popup-page").find("input").val();
        if (Monopoly.isValidInput("numofplayers",numOfPlayers)){
            Monopoly.createPlayers(numOfPlayers);
            Monopoly.closePopup();
        }
    });
};


Monopoly.handleBuy = function(player,propertyCell,propertyCost){
    var playersMoney = Monopoly.getPlayersMoney(player);
    if (playersMoney < propertyCost){
        Monopoly.showErrorMsg();
        Monopoly.playSound("sad2")
    }else{
        Monopoly.updatePlayersMoney(player,propertyCost);
        var rent = Monopoly.calculateProperyRent(propertyCost);

        propertyCell.removeClass("available")
                    .addClass(player.attr("id"))
                    .attr("data-owner",player.attr("id"))
                    .attr("data-rent",rent);
        Monopoly.setNextPlayerTurn();
    }
};



Monopoly.handleAction = function(player,action,amount){
    console.log(action);
    switch(action){
        case "move":
       	    console.log(amount);
            Monopoly.movePlayer(player,amount);
             break;
        case "pay":
            Monopoly.updatePlayersMoney(player,amount);
            Monopoly.setNextPlayerTurn();
            break;
        case "jail":
            Monopoly.sendToJail(player);
            break;
    };
    Monopoly.closePopup();
};



Monopoly.createPlayers = function(numOfPlayers){
    var startCell = $(".go");
    for (var i=1; i<= numOfPlayers; i++){
        var player = $("<div />").addClass("player shadowed").attr("id","player" + i).attr("title","player" + i + ": $" + Monopoly.moneyAtStart);
        startCell.find(".content").append(player);
        if (i==1){
            player.addClass("current-turn");
        }
        player.attr("data-money",Monopoly.moneyAtStart);
    }
};


Monopoly.getNextCell = function(cell){
    var currentCellId = parseInt(cell.attr("id").replace("cell",""));
    var nextCellId = currentCellId + 1;
    if (nextCellId > 40){
        console.log("YAY");
        Monopoly.handlePassedGo();
        nextCellId = 1;
    }
    return $(".cell#cell" + nextCellId);
};


Monopoly.handlePassedGo = function(){
    var player = Monopoly.getCurrentPlayer();
    Monopoly.updatePlayersMoney(player,Monopoly.moneyAtStart/10);
};


Monopoly.isValidInput = function(validate,value){
    var isValid = false;
    switch(validate){
        case "numofplayers":
            if(value > 1 && value <= 4){
                isValid = true;
            }
    }
    if (!isValid){
        Monopoly.showErrorMsg();
    }
    return isValid;

};

Monopoly.showErrorMsg = function(){
    $(".popup-page .invalid-error").fadeTo(500,1);
    setTimeout(function(){
            $(".popup-page .invalid-error").fadeTo(500,0);
    },2000);
};

//this function creates the board and resize it when the window
Monopoly.adjustBoardSize = function(){
    var gameBoard = $(".board");
    var boardSize = Math.min($(window).height(),$(window).width());
    boardSize -= parseInt(gameBoard.css("margin-top")) *2;
    $(".board").css({"height":boardSize,"width":boardSize});
};

Monopoly.closePopup = function(){
    $(".popup-lightbox").fadeOut();
};

Monopoly.playSound = function(sound){
    var snd = new Audio("./sounds/" + sound + ".wav"); 
    snd.play();
};

Monopoly.showPopup = function(popupId){
    $(".popup-lightbox .popup-page").hide();
    $(".popup-lightbox .popup-page#" + popupId).show();
    $(".popup-lightbox").fadeIn();
};

Monopoly.init();