// cloudfunctions/updateweeklyranking/index.js

const cloud = require('wx-server-sdk');
cloud.init();
const db = cloud.database();

exports.main = async (event, context) => {
  const { firstDayOfWeek } = event;
  const $ = db.command.aggregate;
  const _ = db.command;

  console.log("Received event:", event);

  try {
    // Fetch the ranking data
    const ranking = await db
      .collection("track")
      .aggregate()
      .addFields({
        matched: $.gte(["$endTime", $.dateFromString({ dateString: new Date(firstDayOfWeek).toJSON() })])
      })
      .match({ matched: true })
      .group({
        _id: "$_openid",
        totalCarbSum: $.sum("$carbSum")
      })
      .sort({ totalCarbSum: -1 })
      .limit(10)
      .end();

    console.log("Ranking data:", ranking);

    if (!ranking.list || ranking.list.length === 0) {
      console.error("No ranking data found");
      return { rankedUsers: [] };
    }

    // Fetch user details
    const topUserOpenIds = ranking.list.map(item => item._id);
    const userDetails = await db
      .collection("userInfo")
      .where({ _openid: _.in(topUserOpenIds) })
      .get();

    console.log("User details data:", userDetails);

    if (!userDetails.data || userDetails.data.length === 0) {
      console.error("No user details found");
      return { rankedUsers: [] };
    }

    // Combine user details with their total carb sums
    const rankedUsers = userDetails.data.map(user => {
      const userAggregate = ranking.list.find(agg => agg._id === user._openid);
      return {
        ...user,
        totalCarbSum: Math.ceil(userAggregate ? userAggregate.totalCarbSum : 0),
        rank: topUserOpenIds.indexOf(user._openid) + 1
      };
    });

    // Optionally sort by rank (if needed, since they should already be in order)
    rankedUsers.sort((a, b) => a.rank - b.rank);

    console.log("Ranked users:", rankedUsers);

    return { rankedUsers };
  } catch (error) {
    console.error("Error updating weekly ranking:", error);
    throw error;
  }
};
