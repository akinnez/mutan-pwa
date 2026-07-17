interface IOPTGrid{
    values: string[];
    setValues: (v: string[]) => void;
    refs:any
  }

  
export default function OtpGrid({
refs,
setValues,
values
}:IOPTGrid) {
    const handleOtpChange = (
    refs:any,
    values: string[],
    setValues: (v: string[]) => void,
    i: number,
    val: string,
  ) => {
    const newVals = [...values];
    newVals[i] = val.slice(-1);
    setValues(newVals);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handleOtpKey = (
    refs: any,
    values: string[],
    setValues: (v: string[]) => void,
    i: number,
    key: string,
  ) => {
    if (key === "Backspace" && !values[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

    return (
<div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={v}
          onChange={(e) =>
            handleOtpChange(refs, values, setValues, i, e.target.value)
          }
          onKeyDown={(e) => handleOtpKey(refs, values, setValues, i, e.key)}
          className="otp-input"
        />
      ))}
    </div>
    )
}