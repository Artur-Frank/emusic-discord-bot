const decode = require('./decode');

async function PlayListMusic(HTTPClient, FromData, QuantityItem, callback) {
    try {
        let item = [];

        await HTTPClient.request('al_audio.php', FromData).then((res) => {
            if (typeof res.payload[1][0] != 'string') {
                if (res.payload[1][0] != false) {
                    res.payload[1][0].list.slice(0, QuantityItem).map(e => {
                        let a = 0;
                        if (e[17] != "") { a = e[17][0].id }
                        item.push({
                            type: "reload_audio",
                            artist: a,
                            link: "null",
                            name: e[4] + " - " + e[3],
                            image: e[14].split(",")[0],
                            body: `${e[1]}_${e[0]}_${e[13].split('//')[1]}_${e[13].split('//')[2].replace('/', "").slice(0, -1)}`,
                            userID: res.payload[1][0].ownerId,
                            duration: e[15].duration
                        });
                    })
                    if (item.length > 0) { callback(item) } else { callback(undefined) }
                }
                else { callback(undefined) }
            }
            else {
                if (res.payload[1][1] != false) {
                    res.payload[1][1].playlistData.list.slice(0, QuantityItem).map(e => {
                        let a = 0;
                        if (e[17][0].id != undefined) { a = e[17][0].id }
                        item.push({
                            type: "reload_audio",
                            artist: a,
                            link: "null",
                            name: e[4] + " - " + e[3],
                            image: e[14].split(",")[0],
                            body: `${e[1]}_${e[0]}_${e[13].split('//')[1]}_${e[13].split('//')[2].replace('/', "").slice(0, -1)}`,
                            userID: res.payload[1][0].ownerId,
                            duration: e[15].duration
                        });
                    })
                    if (item.length > 0) { callback(item) } else { callback(undefined) }
                }
                else { callback(undefined) }
            }

        });
    } catch (err) { console.log(err); callback(undefined) }
}

async function GetMusic(HTTPClient, ListMusic, callback) {
    try {

        let newList = [];

        for (let i = 0; i < ListMusic.length; i += 10) {
            newList.push(ListMusic.slice(i, i + 10));
        }

        await Promise.all(newList.map(async (task, index) => {
            let ids = "";
            task.map((id) => {
                ids += id.body + ",";
            })

            await HTTPClient.request('al_audio.php', {
                act: 'reload_audio',
                al: 1,
                ids: ids.slice(0, -1)
            }).then((res) => {
                for (let i = (10 * index), c = 0; i < (10 * index) + res.payload[1][0].length; c++, i++) {
                    ListMusic[i].link = decode(res.payload[1][0][c][2], HTTPClient._vk.session.user_id);
                }
            })
        }))
            .then(() => {
                if (ListMusic.length > 0) { return callback({ item: ListMusic }) }
                else { return callback(undefined) }
            })
    } catch { callback(undefined) }
}

module.exports = async (HTTPClient, FromData, QuantityItem, callback) => {
    try {
        await PlayListMusic(HTTPClient, FromData, QuantityItem, async (res) => {
            if (await res != undefined) {
                await GetMusic(HTTPClient, res, async (list) => await callback(list))
            }
            else { await callback("No access to playlist") }
        });
    } catch { callback(undefined) }
}