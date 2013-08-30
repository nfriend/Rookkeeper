CREATE TABLE `name` (
	`id` INT(10) NOT NULL AUTO_INCREMENT,
	`name` VARCHAR(50) NOT NULL,
	`team_1_name` VARCHAR(50) NOT NULL,
	`team_2_name` VARCHAR(50) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE INDEX `name` (`name`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=36;

CREATE TABLE `name_round_assoc` (
	`id` INT(10) NOT NULL AUTO_INCREMENT,
	`name_id` INT(10) NOT NULL,
	`round_id` INT(10) NOT NULL,
	`order` INT(10) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`),
	UNIQUE INDEX `name_id_round_id` (`name_id`, `round_id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=438;

CREATE TABLE `round` (
	`id` INT(10) NOT NULL AUTO_INCREMENT,
	`left` INT(10) NOT NULL DEFAULT '0',
	`bid` INT(10) NOT NULL DEFAULT '0',
	`right` INT(10) NOT NULL DEFAULT '0',
	`bid_direction` VARCHAR(5) NOT NULL DEFAULT '0',
	PRIMARY KEY (`id`)
)
COLLATE='latin1_swedish_ci'
ENGINE=InnoDB
AUTO_INCREMENT=481;

DELIMITER //

CREATE PROCEDURE `fetch_game`(IN `game_name` VARCHAR(50))
	LANGUAGE SQL
	NOT DETERMINISTIC
	CONTAINS SQL
	SQL SECURITY DEFINER
	COMMENT ''
BEGIN
	DECLARE game_id INT;
	SET game_id = (SELECT id FROM name WHERE name LIKE game_name);
	
	IF game_id IS NOT NULL THEN
		
			SELECT `left`, `bid`, `right`, `bid_direction` AS 'bidDirection', `team_1_name` AS 'team1Name', `team_2_name` AS 'team2Name' FROM round r
			INNER JOIN name_round_assoc nra ON r.id = nra.round_id
			INNER JOIN name n ON n.id = nra.name_id
			WHERE r.id IN (
				SELECT round_id FROM name_round_assoc WHERE name_id = game_id
			)
			ORDER by `order`;
		
	END IF;
END //

CREATE PROCEDURE `delete_game`(IN `game_name` VARCHAR(50))
	LANGUAGE SQL
	NOT DETERMINISTIC
	CONTAINS SQL
	SQL SECURITY DEFINER
	COMMENT ''
BEGIN
	DECLARE game_id INT;
	SET game_id = (SELECT id FROM name WHERE name LIKE game_name);
	
	IF game_id IS NOT NULL THEN
		DELETE FROM name WHERE id = game_id;
		DELETE FROM round WHERE id IN (
			SELECT round_id FROM name_round_assoc WHERE name_id = game_id
		);
		DELETE FROM name_round_assoc WHERE name_id = game_id;
	END IF;
END //

CREATE PROCEDURE `create_round`(IN `left` INT, IN `bid` INT, IN `right` INT, IN `bid_direction` VARCHAR(5))
	LANGUAGE SQL
	NOT DETERMINISTIC
	CONTAINS SQL
	SQL SECURITY DEFINER
	COMMENT ''
BEGIN
	INSERT INTO round (`left`, bid, `right`, bid_direction)
	VALUES (`left`, bid, `right`, bid_direction);
	SELECT LAST_INSERT_ID() AS 'LAST_INSERT_ID';
END //

CREATE PROCEDURE `create_game`(IN `game_name` VARCHAR(50), IN `team_1_name` VARCHAR(50), IN `team_2_name` VARCHAR(50))
	LANGUAGE SQL
	NOT DETERMINISTIC
	CONTAINS SQL
	SQL SECURITY DEFINER
	COMMENT ''
BEGIN
	INSERT INTO name (`name`, team_1_name, team_2_name)
	VALUES (game_name, team_1_name, team_2_name);
	SELECT LAST_INSERT_ID() AS 'LAST_INSERT_ID';

END //

CREATE PROCEDURE `associate`(IN `name_id` INT, IN `round_id` INT, IN `order` INT)
	LANGUAGE SQL
	NOT DETERMINISTIC
	CONTAINS SQL
	SQL SECURITY DEFINER
	COMMENT ''
BEGIN
	INSERT INTO name_round_assoc (`name_id`, `round_id`, `order`)
	VALUES (`name_id`, `round_id`, `order`);
END //