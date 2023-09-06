class Calc {
    round = (value, precision) => {
        var multiplier = Math.pow(10, precision || 0);
        return Math.round(value * multiplier) / multiplier;
    };

    calcValues = (target, actual) => {
        // setGapValue(`${(valuesRef.current[3].value/valuesRef.current[2].value) * 100}%`)
        const gap = `${target - actual < 0 ? "--" : Math.round(target - actual)}`;
        const eff = `${this.round((actual / target) * 100, 1)}%`;

        return [gap, eff];
    };

    getValues = (data) => {
        const dailyTarget = data.dailyTarget ?? "0";
        const weeklyTarget = data.weeklyTarget ?? "0";
        const monthlyTarget = data.monthlyTarget ?? "0";
        const actual = data.actual ?? "0";
        const totalShifts = data.totalShifts ?? "1";
        const totalHrs = data.totalHrs ?? "9";
        const remarks = data.remarks ?? "";
        return {
            actual: actual,
            dailyTarget: dailyTarget,
            weeklyTarget: weeklyTarget,
            monthlyTarget: monthlyTarget,
            totalShifts: totalShifts,
            totalHrs: totalHrs,
            remarks: remarks,
        };
    };

    getTodaysValues = async (dayData, pastDate = null) => {
        return new Promise((resolve) => {
            if (!dayData || dayData?.length < 1) resolve({ target: "0", actual: "0", gap: "0", eff: "0%" });

            let today, idx;
            if (pastDate) today = new Date(new Date(pastDate).toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
            else today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
            today.setHours(0, 0, 0, 0);

            if (pastDate) {
                idx = dayData.findIndex((item) => item.timestamp === today.getTime());
            }
            if (!pastDate || idx === -1) idx = 0;

            const { actual, dailyTarget, weeklyTarget, monthlyTarget, totalShifts, totalHrs, remarks } = this.getValues(
                dayData[idx]
            );

            if (dayData[idx].timestamp !== today.getTime()) {
                const calculated = this.calcValues(dailyTarget, "0");
                resolve({
                    target: dailyTarget,
                    monthlyTarget: monthlyTarget,
                    weeklyTarget: weeklyTarget,
                    actual: "0",
                    totalShifts: totalShifts,
                    totalHrs: totalHrs,
                    gap: calculated[0],
                    eff: calculated[1],
                    remarks: ["N/A"],
                });
            }

            const calculated = this.calcValues(dailyTarget, actual);

            resolve({ target: dailyTarget, actual: actual, gap: calculated[0], eff: calculated[1], ...dayData[idx] });
        });
    };

    getPastValues = (monthDate, fromDate, toDate = null) => {
        return new Promise((resolve) => {
            console.log(fromDate, toDate);
            if (!monthDate || monthDate?.length < 1 || !fromDate)
                resolve({ target: "0", actual: "0", gap: "0", eff: "0" });

            console.log(monthDate);
            const from = new Date(fromDate); //.toLocaleString('en-US', {timeZone: "Asia/Riyadh"})
            const to = new Date(toDate); //.toLocaleString('en-US', {timeZone: "Asia/Riyadh"})
            // else to = new Date(new Date(toDate).toLocaleString('en-US', {timeZone: "Asia/Riyadh"}))
            // to.setHours(0,0,0,0);

            let actual = 0;
            let target = 0;
            let remarks = [];

            console.log(from);
            console.log(to);
            for (const value of monthDate.entries()) {
                // if (value.timestamp < lastDay.getTime()) break;

                console.log(`Timestamp: ${value[1].timestamp}`);
                console.log(`toDate: ${to.getTime()}`);
                console.log(`fromDate: ${from.getTime()}`);
                if (value[1].timestamp > to.getTime()) continue;
                if (value[1].timestamp < from.getTime()) {
                    // idx = index //> 0? index - 1 : 0
                    break;
                }
                console.log(value[1].actual);

                actual += value[1]?.actual ? parseInt(value[1]?.actual) : 0;
                target += value[1]?.dailyTarget ? parseInt(value[1]?.dailyTarget) : 0;
                if (value[1]?.remarks && Array.isArray(value[1]?.remarks)) remarks = remarks.concat(value[1]?.remarks);
                else if (value[1]?.remarks) remarks.push(value[1]?.remarks);
            }

            let idx;
            console.log(remarks);
            console.log(`Actual: ${actual}`);
            console.log(`Target: ${target}`);
            // idx = monthDate.findIndex((item) => item.timestamp === from.getTime())

            // if (idx === -1) idx = 0

            // const {monthlyTarget} = this.getValues(monthDate[idx])

            const calculated = this.calcValues(target, actual ? actual : 0);

            const monthObj = {
                target: target,
                actual: actual ? actual : 0,
                gap: calculated[0],
                eff: calculated[1],
                remarks: remarks,
            };

            resolve(monthObj);
        });
    };
}

module.exports = Calc;
