#include "Discord.h"
#include "StdAfx.h"
#include <iostream>
#include <ctime>

time_t starttime = time(0);

char* Class = "www.shaiyalastdance.com";
char* ClassImg = "logo";
char* Rank = "";
char* RankImg = "none";
char* CharName = "";
int MapID = -1;
int Level = -1;
int Kill = -1;
int Login = 0;
int Job = -1;
int Family = -1;
char Character[200];



void Data() {
    CharName = reinterpret_cast<char*>(0x9144CE);
    MapID = (int)*reinterpret_cast<short*>(0x90E2E0);
    Level = (int)*reinterpret_cast<short*>(0x90D1E4);
    Job = (int)*reinterpret_cast<short*>(0x913473);
    Family = (int)*reinterpret_cast<bool*>(0x022AA816);
    Kill = (int)*reinterpret_cast<long*>(0x022AAE3C);



    strcpy(Character, getCharLevel(Level));
    strcat(Character, "\n");
    strcat(Character, CharName);


    if (Family == 0 && Job == 0) {
        Class = "Luchador";
        ClassImg = "fighter";
    }
    else if (Family == 0 && Job == 1) {
        Class = "Defensor";
        ClassImg = "defender";
    }
    else if (Family == 0 && Job == 2) {
        Class = "Ranger";
        ClassImg = "ranger";
    }
    else if (Family == 0 && Job == 3) {
        Class = "Arquero";
        ClassImg = "archer";
    }
    else if (Family == 0 && Job == 4) {
        Class = "Mago";
        ClassImg = "mage";
    }
    else if (Family == 0 && Job == 5) {
        Class = "Clerigo";
        ClassImg = "priest";
    }
    if (Family == 1 && Job == 0) {
        Class = "Guerrero";
        ClassImg = "war";
    }
    else if (Family == 1 && Job == 1) {
        Class = "Guardian";
        ClassImg = "guard";
    }
    else if (Family == 1 && Job == 2) {
        Class = "Asesino";
        ClassImg = "assasin";
    }
    else if (Family == 1 && Job == 3) {
        Class = "Hunter";
        ClassImg = "hunter";
    }
    else if (Family == 1 && Job == 4) {
        Class = "Pagano";
        ClassImg = "pagan";
    }
    else if (Family == 1 && Job == 5) {
        Class = "Oraculo";
        ClassImg = "oracle";
    }


    if (Kill == 0) {

        RankImg = "none";

    }
    else if (Kill > 0 && Kill < 50) {
        RankImg = "rank1";

    }
    else if (Kill >= 50 && Kill < 300) {
        RankImg = "rank2";

    }
    else if (Kill >= 300 && Kill < 1000) {
        RankImg = "rank3";

    }
    else if (Kill >= 1000 && Kill < 5000) {
        RankImg = "rank4";

    }
    else if (Kill >= 5000 && Kill < 10000) {
        RankImg = "rank5";

    }
    else if (Kill >= 10000 && Kill < 20000) {
        RankImg = "rank6";

    }
    else if (Kill >= 20000 && Kill < 30000) {
        RankImg = "rank7";

    }
    else if (Kill >= 30000 && Kill < 40000) {
        RankImg = "rank8";

    }
    else if (Kill >= 40000 && Kill < 50000) {
        RankImg = "rank9";

    }
    else if (Kill >= 50000 && Kill < 70000) {
        RankImg = "rank10";

    }
    else if (Kill >= 70000 && Kill < 90000) {
        RankImg = "rank11";

    }
    else if (Kill >= 90000 && Kill < 110000) {
        RankImg = "rank12";

    }
    else if (Kill >= 110000 && Kill < 130000) {
        RankImg = "rank13";

    }
    else if (Kill >= 130000 && Kill < 150000) {
        RankImg = "rank14";

    }
    else if (Kill >= 150000 && Kill < 200000) {
        RankImg = "rank15";

    }
    else if (Kill >= 200000 && Kill < 250000) {
        RankImg = "rank16";

    }
    else if (Kill >= 250000 && Kill < 300000) {
        RankImg = "rank17";

    }
    else if (Kill >= 300000 && Kill < 350000) {
        RankImg = "rank18";

    }
    else if (Kill >= 350000 && Kill < 400000) {
        RankImg = "rank19";

    }
    else if (Kill >= 400000 && Kill < 450000) {
        RankImg = "rank20";

    }
    else if (Kill >= 450000 && Kill < 500000) {
        RankImg = "rank21";

    }
    else if (Kill >= 500000 && Kill < 550000) {
        RankImg = "rank22";

    }
    else if (Kill >= 550000 && Kill < 600000) {
        RankImg = "rank23";

    }
    else if (Kill >= 600000 && Kill < 650000) {
        RankImg = "rank24";

    }
    else if (Kill >= 650000 && Kill < 700000) {
        RankImg = "rank25";

    }
    else if (Kill >= 700000 && Kill < 750000) {
        RankImg = "rank26";

    }
    else if (Kill >= 750000 && Kill < 800000) {
        RankImg = "rank27";

    }
    else if (Kill >= 800000 && Kill < 850000) {
        RankImg = "rank28";

    }
    else if (Kill >= 850000 && Kill < 900000) {
        RankImg = "rank29";

    }
    else if (Kill >= 900000 && Kill < 1000000) {
        RankImg = "rank30";

    }
    else if (Kill == 1000000) {
        RankImg = "rank31";

    }
}




void Initialize() {
    DiscordEventHandlers Handle;
    memset(&Handle, 0, sizeof(Handle));
    Discord_Initialize("1344505637450809438", &Handle, 1, NULL); // 774244560444456980 Discord Client ID
}

void Update() {

    DiscordRichPresence discordPresence;
    memset(&discordPresence, 0, sizeof(discordPresence));
    discordPresence.startTimestamp = starttime;
    discordPresence.details = Character;
     discordPresence.state = getMapName(MapID);
    discordPresence.largeImageKey = ClassImg;
    discordPresence.largeImageText = Class;
    discordPresence.smallImageKey = RankImg;
    discordPresence.smallImageText = Rank;
    Discord_UpdatePresence(&discordPresence);

}

void UpdateData() {
    while (true) {
        Update();
        Data();
        Sleep(5000); // Update each 5 seconds
    }
}

void Discord()
{
    CreateThread(NULL, NULL, LPTHREAD_START_ROUTINE(UpdateData), NULL, 0, 0);
    CreateThread(NULL, NULL, LPTHREAD_START_ROUTINE(Initialize), NULL, 0, 0);
}

