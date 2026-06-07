import { Box, Paper, InputBase, Button } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import styles from './Search.module.css';

const Search = () => {
    return (
        <Box className={styles.search}>
            <Paper component="form" className={styles.searchBar}
            sx={{
                backgroundColor: '#d9d9d9',
                borderRadius: '24px',
            }}>
                <InputBase
                    sx={{ ml: 1, flex: 1 }}
                    placeholder="Search..."
                />
                <SearchIcon />
            </Paper>
            <Button variant="contained" color="primary" className={styles.searchButton}
            sx={{
                borderRadius: '24px',
                textTransform: 'none',
            }}>
                Search
            </Button>
        </Box>
    );
}

export default Search;