import { Box, TextField } from "@mui/material";
import { useState, useEffect } from "react";

const Field = (props: {
  label: string,
  content: string,
  isEdit: boolean,
  onChange?: (value: string) => void
}) => {
  const [value, setValue] = useState(props.content);

  useEffect(() => {
    setValue(props.content);
  }, [props.content]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
    if (props.onChange) props.onChange(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ fontSize: '16px', color: '#858585' }}>{props.label}</Box>
      <TextField
        sx={{ fontSize: '10px', fontWeight: 'bold' }}
        size="medium"
        value={value ?? ""}
        onChange={handleChange}
        disabled={props.isEdit}
      />
    </Box>
  )
}

export default Field;
