async function testFloat() {
    const payload = {
        templateBase: {
            storeId: 1694577214130,
            barCode: "1010100131",
            agencyId: 1694577214130,
            merchantId: 1775639851383,
            modelId: "[65]",
            resolution: "152*152",
            width: 152,
            height: 152,
            itemNum: 1
        },
        templateElements: [
            {
                type: 1,
                marginLeft: 132,
                marginTop: 139.99998474121094, // Float!
                width: 100,
                height: 30,
                content: "Text / نص",
                layer: 0,
                itemOrder: 1,
                fontType: "Arial",
                fontSize: 14,
                horizontalAlign: 0,
                color: "#000000",
                borderColor: "#000000",
                fillColor: "",
                fillinColor: "",
                stroke: "#000000",
                angle: 0,
                barcodeType: 10,
                borderType: 1,
                conRealResult: 1,
                dateFormat: "YYYY-MM-dd HH:mm:ss",
                decimalSeparator: "point",
                fieldCode: "price",
                ifBold: 0,
                ifCondition: 0,
                ifItalic: 0,
                ifStrikeThrough: 0,
                ifUnderline: 0,
                lineBreak: "",
                lineWeight: 0,
                maxLines: 3,
                minFontSize: 12,
                noResourceHide: 0,
                omitStyle: 0,
                postfix: "",
                prefix: "",
                scaleX: 0,
                scaleY: 0,
                screenIndex: 0,
                strokeWidth: 0,
                textAdvanceProperty: 0,
                thousandSeparator: "comma",
                verticalAlign: 0,
                verticalSpace: 0
            }
        ]
    };

    const res = await fetch('http://localhost:8080/esl/templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log(`STATUS ${res.status}:`, text);
}

testFloat();
